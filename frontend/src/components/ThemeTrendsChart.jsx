import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react'
import { useState } from 'react'

const COLORS = ['#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1', '#0d9488', '#0f766e', '#115e59']

function ThemeTrendsChart({ history }) {
  const [chartType, setChartType] = useState('bar') // 'bar' or 'pie'

  // Analyze themes across all entries
  const themeData = useMemo(() => {
    const themeCounts = {}
    
    history.forEach(entry => {
      entry.themes?.forEach(theme => {
        const themeName = typeof theme === 'string' ? theme : theme.theme
        themeCounts[themeName] = (themeCounts[themeName] || 0) + 1
      })
    })
    
    return Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // Top 8 themes
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / history.length) * 100) }))
  }, [history])

  // Timeline data - themes over time (by week)
  const timelineData = useMemo(() => {
    const weeklyThemes = {}
    
    history.forEach(entry => {
      const date = new Date(entry.timestamp)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      if (!weeklyThemes[weekKey]) {
        weeklyThemes[weekKey] = { week: weekKey, entries: 0, themes: {} }
      }
      
      weeklyThemes[weekKey].entries++
      entry.themes?.forEach(theme => {
        const themeName = typeof theme === 'string' ? theme : theme.theme
        weeklyThemes[weekKey].themes[themeName] = (weeklyThemes[weekKey].themes[themeName] || 0) + 1
      })
    })
    
    return Object.values(weeklyThemes).slice(-6) // Last 6 weeks
  }, [history])

  if (themeData.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 shadow-lg rounded-xl p-6 text-center">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[#636e72] opacity-50" />
        <p className="text-[#636e72] font-medium">Complete more translations to see theme trends</p>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-gray-200 shadow-lg rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d3436] to-[#3d4a4c] px-6 py-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Theme Trends</h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-lg transition-colors ${chartType === 'bar' ? 'bg-[#14B8A6] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`p-2 rounded-lg transition-colors ${chartType === 'pie' ? 'bg-[#14B8A6] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Patterns in your {history.length} translation{history.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Chart */}
      <div className="p-6">
        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={themeData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={12}
                width={100}
                tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value) => [`${value} time${value !== 1 ? 's' : ''}`, 'Occurrences']}
              />
              <Bar 
                dataKey="count" 
                fill="#14b8a6" 
                radius={[0, 4, 4, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={themeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
                animationDuration={800}
              >
                {themeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, props.payload.name]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {themeData.slice(0, 5).map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-[#636e72] font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      {themeData.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <p className="text-sm text-[#2d3436]">
              <strong>Most frequent:</strong> "{themeData[0].name}" appears in {themeData[0].percentage}% of your translations.
              {themeData.length > 1 && (
                <> This is followed by "{themeData[1].name}" at {themeData[1].percentage}%.</>
              )}
            </p>
            <p className="text-xs text-[#636e72] mt-2 italic">
              This is pattern observation only - not a diagnosis. Consider discussing recurring themes with someone you trust.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeTrendsChart
