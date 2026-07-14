import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, BookOpen, ChevronLeft, ChevronRight, Plus, Flag, Trash2, Pencil, Folder, ChevronDown, FileText, Music as MusicIcon, X } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns'

const API = '/api'

const fetchAPI = async (endpoint: string, options = {}) => {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
    return await res.json()
  } catch (err) {
    console.error(err)
    return null
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const [todos, setTodos] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [memoGroups, setMemoGroups] = useState<any[]>([])
  const [memos, setMemos] = useState<any[]>([])
  const [studies, setStudies] = useState<any[]>([])

  const [newTodo, setNewTodo] = useState('')
  const [selectedStudyId, setSelectedStudyId] = useState('')
  const [editingTodo, setEditingTodo] = useState<any>(null)

  const EXPENSE_CATEGORIES = ['음식', '간식', '약속더치', '웹툰/웹소설/OTT', '게임', '문구/굿즈/책', '클라우드', '음악', '여행', '공연/전시', '앤팀', '교통', '병원', '기타']
  const INCOME_CATEGORIES = ['용돈', '용돈(셀프출금)', '잔액입금', '급여', '저축', '기타']
  const PAYMENT_METHODS = ['자동결제', '앱내결제', '카드', '온라인', '이체']

  const [rightPaneTab, setRightPaneTab] = useState<'todo' | 'schedule'>('todo')
  const [newScheduleTitle, setNewScheduleTitle] = useState('')
  const [budgetType, setBudgetType] = useState<'expense' | 'income'>('expense')
  const [newBudget, setNewBudget] = useState({ category: EXPENSE_CATEGORIES[0], method: PAYMENT_METHODS[2], amount: '', date: format(new Date(), 'yyyy-MM-dd') })

  const [selectedMemoGroup, setSelectedMemoGroup] = useState<any>(null)
  const [newMemo, setNewMemo] = useState('')

  const [showAddStudyModal, setShowAddStudyModal] = useState(false)
  const [editingStudy, setEditingStudy] = useState<any>(null)
  const [newStudyTitle, setNewStudyTitle] = useState('')
  const [newStudyCategory, setNewStudyCategory] = useState('학점은행제')
  const [newStudyTargetDate, setNewStudyTargetDate] = useState('')
  const [newStudyDetails, setNewStudyDetails] = useState<any>({})
  
  const [selectedStudyForDetails, setSelectedStudyForDetails] = useState<any>(null)
  const [studyTodoInput, setStudyTodoInput] = useState('')

  const loadData = async () => {
    const [t, s, b, mg, m, sch] = await Promise.all([
      fetchAPI('/todos'),
      fetchAPI('/studies'),
      fetchAPI('/budget'),
      fetchAPI('/memo_groups'),
      fetchAPI('/memos'),
      fetchAPI('/schedules')
    ])
    if(t) setTodos(t)
    if(s) setStudies(s)
    if(b) setBudgets(b)
    if(mg) {
      setMemoGroups(mg)
      if(mg.length > 0 && !selectedMemoGroup) setSelectedMemoGroup(mg[0].id)
    }
    if(m) setMemos(m)
    if(sch) setSchedules(sch)
  }

  useEffect(() => { loadData() }, [])

  // Todos
  const toggleTodo = async (todo: any) => {
    const updated = { ...todo, done: !todo.done }
    await fetchAPI(`/todos/${todo.id}`, { method: 'PUT', body: JSON.stringify(updated) })
    
    // Update study progress if linked
    if (todo.study_id) {
      const study = studies.find(s => s.id === todo.study_id)
      if (study) {
        const studyUpdated = { ...study, completed_tasks: study.completed_tasks + (updated.done ? 1 : -1) }
        await fetchAPI(`/studies/${study.id}`, { method: 'PUT', body: JSON.stringify(studyUpdated) })
      }
    }
    loadData()
  }

  const startEditTodo = (todo: any) => {
    setEditingTodo(todo)
    setNewTodo(todo.text)
    setSelectedStudyId(todo.study_id ? todo.study_id.toString() : '')
  }

  const saveTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    if (editingTodo) {
      const updated = { ...editingTodo, text: newTodo, study_id: selectedStudyId || null }
      await fetchAPI(`/todos/${editingTodo.id}`, { method: 'PUT', body: JSON.stringify(updated) })
      setEditingTodo(null)
    } else {
      const payload = { text: newTodo, done: false, date: format(selectedDate, 'yyyy-MM-dd'), study_id: selectedStudyId || null }
      await fetchAPI('/todos', { method: 'POST', body: JSON.stringify(payload) })

      if (selectedStudyId) {
        const study = studies.find(s => s.id === Number(selectedStudyId))
        if (study) {
          const studyUpdated = { ...study, total_tasks: study.total_tasks + 1 }
          await fetchAPI(`/studies/${study.id}`, { method: 'PUT', body: JSON.stringify(studyUpdated) })
        }
      }
    }
    setNewTodo('')
    setSelectedStudyId('')
    loadData()
  }

  const deleteTodo = async (id: number, studyId: number | null) => {
    await fetchAPI(`/todos/${id}`, { method: 'DELETE' })
    if (studyId) {
      const study = studies.find(s => s.id === studyId)
      if (study) {
        // Decrease total tasks
        const studyUpdated = { ...study, total_tasks: Math.max(0, study.total_tasks - 1) }
        await fetchAPI(`/studies/${study.id}`, { method: 'PUT', body: JSON.stringify(studyUpdated) })
      }
    }
    loadData()
  }

  // Schedules
  const addSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScheduleTitle.trim()) return
    await fetchAPI('/schedules', { method: 'POST', body: JSON.stringify({ title: newScheduleTitle, date: format(selectedDate, 'yyyy-MM-dd') }) })
    setNewScheduleTitle('')
    loadData()
  }

  const deleteSchedule = async (id: number) => {
    await fetchAPI(`/schedules/${id}`, { method: 'DELETE' })
    loadData()
  }

  // Budget
  const handleBudgetTypeChange = (type: 'expense' | 'income') => {
    setBudgetType(type)
    setNewBudget(prev => ({
      ...prev,
      category: type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0],
      method: type === 'expense' ? PAYMENT_METHODS[2] : ''
    }))
  }

  const addBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBudget.category || !newBudget.amount) return
    const finalAmount = budgetType === 'expense' ? -Math.abs(Number(newBudget.amount)) : Math.abs(Number(newBudget.amount))
    await fetchAPI('/budget', { method: 'POST', body: JSON.stringify({ ...newBudget, amount: finalAmount }) })
    setNewBudget({ ...newBudget, amount: '' })
    loadData()
  }
  
  const deleteBudget = async (id: number) => {
    await fetchAPI(`/budget/${id}`, { method: 'DELETE' })
    loadData()
  }

  // Memo
  const addMemoGroup = async () => {
    const name = prompt('새 그룹 이름을 입력하세요:')
    if (name) {
      await fetchAPI('/memo_groups', { method: 'POST', body: JSON.stringify({ name }) })
      loadData()
    }
  }

  const addMemo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemo.trim() || !selectedMemoGroup) return
    await fetchAPI('/memos', { method: 'POST', body: JSON.stringify({ content: newMemo, group_id: selectedMemoGroup }) })
    setNewMemo('')
    loadData()
  }

  const deleteMemo = async (id: number) => {
    await fetchAPI(`/memos/${id}`, { method: 'DELETE' })
    loadData()
  }

  // Studies
  const addSubject = () => {
    const subjects = newStudyDetails.subjects || []
    setNewStudyDetails({ ...newStudyDetails, subjects: [...subjects, { id: Date.now().toString(), name: '', lectureCount: '', midtermDate: '', finalDate: '', assignmentDate: '' }] })
  }
  const updateSubject = (id: string, field: string, value: string) => {
    const updated = (newStudyDetails.subjects || []).map((s: any) => s.id === id ? { ...s, [field]: value } : s)
    setNewStudyDetails({ ...newStudyDetails, subjects: updated })
  }
  const removeSubject = (id: string) => {
    const updated = (newStudyDetails.subjects || []).filter((s: any) => s.id !== id)
    setNewStudyDetails({ ...newStudyDetails, subjects: updated })
  }

  const handleAddStudy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudyTitle.trim()) return
    
    if (editingStudy) {
      const updated = { ...editingStudy, title: newStudyTitle, category: newStudyCategory, target_date: newStudyTargetDate, details: JSON.stringify(newStudyDetails) }
      await fetchAPI(`/studies/${editingStudy.id}`, { method: 'PUT', body: JSON.stringify(updated) })
    } else {
      await fetchAPI('/studies', { 
        method: 'POST', 
        body: JSON.stringify({ 
          title: newStudyTitle, 
          color: 'bg-sky-500',
          category: newStudyCategory,
          target_date: newStudyTargetDate,
          details: JSON.stringify(newStudyDetails)
        }) 
      })
    }
    setNewStudyTitle('')
    setNewStudyCategory('학점은행제')
    setNewStudyTargetDate('')
    setNewStudyDetails({})
    setEditingStudy(null)
    setShowAddStudyModal(false)
    if(selectedStudyForDetails && editingStudy && selectedStudyForDetails.id === editingStudy.id) {
       // update detail modal view if it was open
       loadData().then(() => {
          setSelectedStudyForDetails((prev: any) => ({...prev, title: newStudyTitle, category: newStudyCategory, target_date: newStudyTargetDate, details: JSON.stringify(newStudyDetails)}))
       })
    } else {
       loadData()
    }
  }

  const deleteStudy = async (id: number) => {
    if(!confirm('정말 삭제하시겠습니까? 관련 할일도 함께 지워질 수 있습니다.')) return;
    await fetchAPI(`/studies/${id}`, { method: 'DELETE' })
    setSelectedStudyForDetails(null)
    loadData()
  }

  const openStudyModal = (study: any = null) => {
    if (study) {
      setEditingStudy(study)
      setNewStudyTitle(study.title)
      setNewStudyCategory(study.category || '기타')
      setNewStudyTargetDate(study.target_date || '')
      try {
        setNewStudyDetails(study.details ? JSON.parse(study.details) : {})
      } catch(e) {
        setNewStudyDetails({})
      }
    } else {
      setEditingStudy(null)
      setNewStudyTitle('')
      setNewStudyCategory('학점은행제')
      setNewStudyTargetDate('')
      setNewStudyDetails({})
    }
    setShowAddStudyModal(true)
  }

  const saveStudyTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studyTodoInput.trim() || !selectedStudyForDetails) return
    const payload = { text: studyTodoInput, done: false, date: format(selectedDate, 'yyyy-MM-dd'), study_id: selectedStudyForDetails.id }
    await fetchAPI('/todos', { method: 'POST', body: JSON.stringify(payload) })
    
    // update study task count
    const studyUpdated = { ...selectedStudyForDetails, total_tasks: (selectedStudyForDetails.total_tasks || 0) + 1 }
    await fetchAPI(`/studies/${selectedStudyForDetails.id}`, { method: 'PUT', body: JSON.stringify(studyUpdated) })
    
    setStudyTodoInput('')
    loadData().then(() => {
       setSelectedStudyForDetails((prev: any) => ({...prev, total_tasks: (prev.total_tasks || 0) + 1}))
    })
  }

  // Calendar
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const dateFormat = "d"
    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat)
        const cloneDay = day
        const dayStr = format(cloneDay, 'yyyy-MM-dd')
        
        const dayTodos = todos.filter(t => t.date === dayStr)
        const hasTodo = dayTodos.length > 0
        const allDone = hasTodo && dayTodos.every(t => t.done)

        const dayBudgets = budgets.filter(b => b.date === dayStr)
        const dayIncome = dayBudgets.filter(b => Number(b.amount) > 0).reduce((acc, b) => acc + Number(b.amount), 0)
        const dayExpense = dayBudgets.filter(b => Number(b.amount) < 0).reduce((acc, b) => acc + Math.abs(Number(b.amount)), 0)
        
        const dayStudies = studies.filter(s => s.target_date === dayStr || (s.details && s.details.includes(dayStr)))

        days.push(
          <div
            key={day.toString()}
            className={`p-2 border border-slate-100 min-h-[60px] md:min-h-[70px] cursor-pointer transition-colors flex flex-col ${
              !isSameMonth(day, monthStart) ? "text-slate-300 bg-slate-50" : 
              isSameDay(day, selectedDate) ? "bg-sky-50 border-sky-200 shadow-inner" : "bg-white hover:bg-slate-50"
            }`}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className={`text-xs font-semibold mb-1 ${isSameDay(day, selectedDate) ? 'text-sky-600' : 'text-slate-600'}`}>
              {formattedDate}
            </div>
            <div className="flex flex-col gap-0.5 mt-auto">
              <div className="flex gap-1 flex-wrap mb-0.5">
                {hasTodo && <div className={`w-1.5 h-1.5 rounded-full ${allDone ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>}
                {dayStudies.map(s => <div key={s.id} className={`w-1.5 h-1.5 rounded-full ${s.color || 'bg-sky-500'}`}></div>)}
              </div>
              {dayIncome > 0 && <div className="text-[8px] text-emerald-500 font-medium leading-none truncate border-l border-emerald-500 pl-1">+{dayIncome.toLocaleString()}</div>}
              {dayExpense > 0 && <div className="text-[8px] text-rose-500 font-medium leading-none truncate border-l border-rose-500 pl-1">-{dayExpense.toLocaleString()}</div>}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 mb-1" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    return <div>{rows}</div>
  }

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedTodos = todos.filter(t => t.date === selectedDateStr)
  const currentGroupMemos = memos.filter(m => m.group_id === selectedMemoGroup)
  
  const currentMonthBudgets = budgets.filter(b => isSameMonth(new Date(b.date), currentMonth))
  const currentMonthIncome = currentMonthBudgets.filter(b => Number(b.amount) > 0).reduce((acc, b) => acc + Number(b.amount), 0)
  const currentMonthExpense = currentMonthBudgets.filter(b => Number(b.amount) < 0).reduce((acc, b) => acc + Number(b.amount), 0)

  return (
    <div className="w-full">
      <main className="dashboard-container">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4">
            {/* Calendar Box */}
            <div className="content-box">
              <h2 className="title-inline flex justify-between items-center mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Calendar
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-sky-200/50 rounded">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-sm w-24 text-center">
                    {format(currentMonth, 'yyyy년 M월')}
                  </span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-sky-200/50 rounded">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </h2>
              
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-400 py-1">{day}</div>
                ))}
              </div>
              {renderCalendar()}
              
              <div className="mt-3 pt-3 border-t border-[#ddedf8] flex flex-wrap gap-6 justify-between items-center">
                <div className="flex gap-6 items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium mb-0.5">이번 달 수입</span>
                    <span className="text-sm font-bold text-sky-600">+{currentMonthIncome.toLocaleString()} 원</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium mb-0.5">이번 달 지출</span>
                    <span className="text-sm font-bold text-sky-400">{currentMonthExpense.toLocaleString()} 원</span>
                  </div>
                </div>
                
                <div className="flex flex-col flex-1 max-w-[400px]">
                  <span className="text-xs text-slate-500 font-medium mb-1.5 flex justify-between">
                    <span>이번 달 진행 중인 목표 / 스터디</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {studies.filter(s => s.target_date && isSameMonth(new Date(s.target_date), currentMonth)).length === 0 ? (
                      <span className="text-xs text-slate-400">이번 달 마감인 목표가 없습니다.</span>
                    ) : (
                      studies.filter(s => s.target_date && isSameMonth(new Date(s.target_date), currentMonth)).map(study => (
                        <div key={study.id} className="flex items-center gap-1 bg-white border border-[#ddedf8] px-2 py-0.5 rounded text-xs text-slate-600">
                          <div className={`w-1.5 h-1.5 rounded-full ${study.color || 'bg-sky-500'}`}></div>
                          <span>{study.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plan Box */}
              <div className="section-group">
                <div className="title-box flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <span className="bg-[linear-gradient(to_top,#bde7ff_40%,transparent_40%)] px-1">Plan</span> <span className="text-sm font-normal text-slate-500">({format(selectedDate, 'M/d')})</span>
                  </span>
                  {editingTodo && rightPaneTab === 'todo' && (
                    <button onClick={() => { setEditingTodo(null); setNewTodo(''); setSelectedStudyId('') }} className="text-xs text-[#3a6d8c]/60 hover:text-[#3a6d8c]">취소</button>
                  )}
                </div>
                <div className="content-box flex flex-col" style={{ height: 'calc(350px - 40px)' }}>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setRightPaneTab('schedule')} className={`flex-1 py-1 text-xs rounded transition-colors ${rightPaneTab === 'schedule' ? 'bg-[#8ECAE6] text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>일정</button>
                    <button onClick={() => setRightPaneTab('todo')} className={`flex-1 py-1 text-xs rounded transition-colors ${rightPaneTab === 'todo' ? 'bg-[#5BB5D5] text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>할 일</button>
                  </div>

                  <div className="flex-1 overflow-auto mb-2 min-h-0">
                    <ul className="flex flex-col gap-2 pr-2">
                      {rightPaneTab === 'todo' ? (
                        selectedTodos.length === 0 ? (
                          <li className="text-sm text-slate-400 text-center py-4">할 일이 없습니다.</li>
                        ) : (
                          selectedTodos.map(item => (
                            <li key={item.id} className="flex items-start justify-between gap-2 text-sm group border-b border-slate-50 pb-2">
                              <div className="flex items-start gap-2 max-w-[80%]">
                                <button
                                  onClick={() => toggleTodo(item)}
                                  className={`w-4 h-4 mt-0.5 shrink-0 rounded-sm border flex items-center justify-center ${item.done ? 'bg-sky-400 border-sky-400 text-white' : 'bg-white border-slate-300'}`}
                                >
                                  {item.done && <CheckSquare className="w-3 h-3" />}
                                </button>
                                <div className="flex flex-col">
                                  <span className={`${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    {item.text}
                                  </span>
                                  {item.study_id && (
                                    <span className="text-[10px] text-sky-500 font-medium">연동: {studies.find(s => s.id === item.study_id)?.title}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditTodo(item)} className="p-1 text-slate-400 hover:text-sky-500 rounded"><Pencil className="w-3 h-3" /></button>
                                <button onClick={() => deleteTodo(item.id, item.study_id)} className="p-1 text-slate-400 hover:text-rose-500 rounded"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </li>
                          ))
                        )
                      ) : (
                        schedules.filter(s => s.date === format(selectedDate, 'yyyy-MM-dd')).length === 0 ? (
                          <li className="text-sm text-slate-400 text-center py-4">일정이 없습니다.</li>
                        ) : (
                          schedules.filter(s => s.date === format(selectedDate, 'yyyy-MM-dd')).map(item => (
                            <li key={item.id} className="flex items-start justify-between gap-2 text-sm group border-b border-slate-50 pb-2">
                              <div className="flex items-start gap-2 max-w-[80%]">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0"></div>
                                <span className="text-slate-700">{item.title}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => deleteSchedule(item.id)} className="p-1 text-slate-400 hover:text-rose-500 rounded"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </li>
                          ))
                        )
                      )}
                    </ul>
                  </div>
                  
                  {rightPaneTab === 'todo' ? (
                    <form onSubmit={saveTodo} className="mt-auto shrink-0 flex flex-col gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={newTodo}
                          onChange={e => setNewTodo(e.target.value)}
                          placeholder={editingTodo ? "할 일 수정..." : "새 할 일 추가..."} 
                          className="flex-1 min-w-0 text-sm bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-sky-400"
                        />
                        <button type="submit" className="bg-sky-500 text-white p-1.5 rounded hover:bg-sky-600 transition-colors">
                          {editingTodo ? <CheckSquare className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <select 
                          value={selectedStudyId} 
                          onChange={e => setSelectedStudyId(e.target.value)}
                          className="appearance-none w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 pr-8 focus:outline-none focus:border-sky-400 text-slate-600 cursor-pointer"
                        >
                          <option value="">-- 스터디/목표 연동 (선택) --</option>
                          {studies.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={addSchedule} className="mt-auto shrink-0 flex flex-col gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={newScheduleTitle}
                          onChange={e => setNewScheduleTitle(e.target.value)}
                          placeholder="새 일정 추가..." 
                          className="flex-1 min-w-0 text-sm bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#8ECAE6]"
                        />
                        <button type="submit" className="bg-[#8ECAE6] text-white p-1.5 rounded hover:opacity-80 transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Goal Box */}
              <div className="content-box h-[350px] overflow-auto flex flex-col">
                <h2 className="title-line flex justify-between">
                  <span className="flex items-center gap-1">
                    <Flag className="w-4 h-4" />
                    Goal
                  </span>
                  <button onClick={() => setShowAddStudyModal(true)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-sky-500 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </h2>
                <div className="flex-1 overflow-auto flex flex-col gap-3 min-h-0 pr-2">
                  {studies.length === 0 && <p className="text-sm text-slate-400 text-center py-4">등록된 목표가 없습니다.</p>}
                  {studies.map(study => {
                    const total = study.total_tasks || 1; // 0 division 방지
                    const percentage = Math.min(100, Math.round((study.completed_tasks / total) * 100))
                    return (
                      <div key={study.id} className="bg-slate-50 border border-slate-100 p-3 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded leading-none">{study.category || '기타'}</span>
                            <span className="font-semibold text-sm text-slate-700">{study.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {study.description && (
                              <button onClick={() => setSelectedStudyForDetails(study)} className="p-1 text-slate-400 hover:text-sky-500 rounded transition-colors" title="상세 보기">
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span className="text-xs font-medium text-slate-500">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                          <div className={`${study.color || 'bg-sky-500'} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>완료: {study.completed_tasks}</span>
                          <span>목표: {study.total_tasks}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-4">
            
            {/* Contents & Music Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="content-box sky-tint flex-1">
                <h2 className="title-inline"><BookOpen className="w-4 h-4" /> Contents</h2>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['웹툰', '웹소설', '애니', '영화', '드라마', '만화', '소설', '전대물'].map(type => (
                    <button key={type} onClick={() => navigate(`/contents?type=${type}`)} className="px-3 py-1 bg-[#ffffff] text-slate-600 text-xs rounded hover:bg-slate-50 hover:text-[#111] border border-[#c8e2f5] transition-colors">{type}</button>
                  ))}
                </div>
              </div>
              
              <div className="content-box sky-tint flex-1">
                <h2 className="title-inline"><MusicIcon className="w-4 h-4" /> Music</h2>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['곡', '앨범', 'EP', '싱글'].map(type => (
                    <button key={type} onClick={() => navigate(`/music?type=${type}`)} className="px-3 py-1 bg-[#ffffff] text-slate-600 text-xs rounded hover:bg-slate-50 hover:text-[#111] border border-[#c8e2f5] transition-colors">{type}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget & Memo */}
            <div className="flex flex-col gap-4">
              
              {/* Budget Box */}
              <div className="section-group">
                <div className="title-box">
                  Budget
                </div>
                <div className="content-box flex flex-col h-[400px]">
                  <div className="flex justify-between items-center mb-3 p-3 bg-slate-50 rounded border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500">이번 달 수입</span>
                      <span className="text-sm font-semibold" style={{ color: '#5BB5D5' }}>+{currentMonthIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-500">이번 달 지출</span>
                      <span className="text-sm font-semibold" style={{ color: '#8ECAE6' }}>{currentMonthExpense.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto mb-3 min-h-0">
                    <div className="text-sm space-y-2 pr-2">
                      {budgets.length === 0 && <p className="text-center text-slate-400 py-4">내역이 없습니다.</p>}
                      {budgets.map(b => (
                        <div key={b.id} className="flex justify-between items-center border-b border-slate-50 pb-2 group">
                          <div className="flex flex-col">
                            <span className="text-slate-700 text-xs">{b.method ? `[${b.method}] ` : ''}{b.category}</span>
                            <span className="text-[10px] text-slate-400">{b.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-xs`} style={{ color: Number(b.amount) > 0 ? '#5BB5D5' : '#8ECAE6' }}>
                              {Number(b.amount) > 0 ? '+' : ''}{Number(b.amount).toLocaleString()}
                            </span>
                            <button onClick={() => deleteBudget(b.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-1"><Trash2 className="w-3 h-3"/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={addBudget} className="mt-auto shrink-0 flex flex-col gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                    <div className="flex gap-2 mb-1">
                      <button type="button" onClick={() => handleBudgetTypeChange('expense')} className={`flex-1 py-1 text-xs rounded transition-colors ${budgetType === 'expense' ? 'bg-[#8ECAE6] text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>지출</button>
                      <button type="button" onClick={() => handleBudgetTypeChange('income')} className={`flex-1 py-1 text-xs rounded transition-colors ${budgetType === 'income' ? 'bg-[#5BB5D5] text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>수입</button>
                    </div>
                    <div className="flex gap-2">
                      {budgetType === 'expense' && (
                        <div className="relative flex-1 min-w-0">
                          <select value={newBudget.method} onChange={e => setNewBudget({ ...newBudget, method: e.target.value })} className="appearance-none w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 pr-8 focus:outline-none focus:border-sky-400 text-slate-600 cursor-pointer">
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      )}
                      <div className="relative flex-1 min-w-0">
                        <select value={newBudget.category} onChange={e => setNewBudget({...newBudget, category: e.target.value})} className="appearance-none w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 pr-8 focus:outline-none focus:border-sky-400 text-slate-600 cursor-pointer">
                          {(budgetType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <input type="text" value={newBudget.amount} onChange={e => {
                        const rawVal = e.target.value.replace(/[^0-9]/g, '')
                        setNewBudget({...newBudget, amount: rawVal ? Number(rawVal).toLocaleString() + ' 원' : ''})
                      }} placeholder="금액" className="flex-1 min-w-0 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-sky-400" style={{ minWidth: '80px' }} />
                      <input type="date" value={newBudget.date} onChange={e => setNewBudget({...newBudget, date: e.target.value})} className="flex-1 min-w-0 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-sky-400 bg-white" style={{ minWidth: '100px' }} />
                      <button type="submit" className="w-16 shrink-0 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium py-1.5 rounded transition-colors">추가</button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Memo Box */}
              <div className="content-box flex flex-col h-[350px]">
                <h2 className="title-plain flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <Folder className="w-4 h-4" />
                    Memo
                  </span>
                  <button onClick={addMemoGroup} className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded hover:bg-sky-100 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> 그룹
                  </button>
                </h2>
                
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide shrink-0">
                  {memoGroups.map(mg => (
                    <button 
                      key={mg.id} 
                      onClick={() => setSelectedMemoGroup(mg.id)}
                      className={`shrink-0 px-3 py-1 text-xs rounded-full transition-colors border ${selectedMemoGroup === mg.id ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-500 border-[#ddedf8] hover:bg-sky-50'}`}
                    >
                      {mg.name}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-auto bg-slate-50 border border-slate-100 rounded p-2 mb-2 flex flex-col gap-2 min-h-0">
                  {!selectedMemoGroup ? (
                    <p className="text-center text-slate-400 text-sm mt-4">그룹을 선택하거나 추가하세요.</p>
                  ) : currentGroupMemos.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm mt-4">메모가 없습니다.</p>
                  ) : (
                    currentGroupMemos.map(m => (
                      <div key={m.id} className="bg-white p-2 border border-[#ddedf8] rounded text-sm text-slate-700 relative group pr-6">
                        {m.content}
                        <button onClick={() => deleteMemo(m.id)} className="absolute right-1 top-1 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={addMemo} className="mt-auto relative shrink-0">
                  <input
                    type="text"
                    value={newMemo}
                    onChange={e => setNewMemo(e.target.value)}
                    placeholder="메모 입력 후 엔터..."
                    className="w-full text-sm bg-white border border-slate-200 rounded px-3 py-2 pr-10 focus:outline-none focus:border-sky-400 shadow-sm"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-500 hover:text-sky-600 p-1">
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

          </div>
      </main>

      {/* Add Study Modal */}
      {showAddStudyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-[400px] shadow-2xl border border-slate-100 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-800">{editingStudy ? '목표/스터디 수정' : '새 목표/스터디 추가'}</h2>
            </div>
            <form onSubmit={handleAddStudy} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">카테고리</label>
                <div className="flex flex-wrap gap-1.5">
                  {['학점은행제', '학기수업', '자격증', '어학', '운동', '독서', '코딩', '기타'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewStudyCategory(cat)}
                      className={`px-3 py-1.5 text-xs rounded border transition-colors ${newStudyCategory === cat ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">목표 이름 <span className="text-rose-500">*</span></label>
                <input required autoFocus type="text" value={newStudyTitle} onChange={e => setNewStudyTitle(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500" placeholder="예: 정보처리기사 필기" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">마감일 / 목표일 <span className="text-rose-500">*</span></label>
                <input required type="date" value={newStudyTargetDate} onChange={e => setNewStudyTargetDate(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500" />
              </div>
              
              {newStudyCategory === '학점은행제' && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-bold text-slate-700">과목 목록 (학점은행제)</div>
                    <button type="button" onClick={addSubject} className="text-[10px] bg-sky-100 text-sky-600 px-2 py-1 rounded hover:bg-sky-200 font-semibold">+ 과목 추가</button>
                  </div>
                  {(newStudyDetails.subjects || []).length === 0 && <div className="text-xs text-slate-400 text-center py-2 bg-slate-50 rounded border border-dashed border-slate-200">우측 상단의 추가 버튼을 눌러 과목을 등록하세요.</div>}
                  {(newStudyDetails.subjects || []).map((subject: any) => (
                    <div key={subject.id} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded relative">
                      <button type="button" onClick={() => removeSubject(subject.id)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                      <input type="text" placeholder="과목명 (예: 심리학 개론)" value={subject.name} onChange={e => updateSubject(subject.id, 'name', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-sky-500 pr-8" />
                      <div className="flex gap-2">
                        <div className="flex-1">
                           <span className="text-[10px] text-slate-500 block mb-0.5">총 강의 수</span>
                           <input type="number" placeholder="예: 26" value={subject.lectureCount} onChange={e => updateSubject(subject.id, 'lectureCount', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-sky-500" />
                        </div>
                        <div className="flex-1">
                           <span className="text-[10px] text-slate-500 block mb-0.5">과제 제출일</span>
                           <input type="date" value={subject.assignmentDate} onChange={e => updateSubject(subject.id, 'assignmentDate', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-sky-500 bg-white" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                           <span className="text-[10px] text-slate-500 block mb-0.5">중간고사</span>
                           <input type="date" value={subject.midtermDate} onChange={e => updateSubject(subject.id, 'midtermDate', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-sky-500 bg-white" />
                        </div>
                        <div className="flex-1">
                           <span className="text-[10px] text-slate-500 block mb-0.5">기말고사</span>
                           <input type="date" value={subject.finalDate} onChange={e => updateSubject(subject.id, 'finalDate', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-sky-500 bg-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {(newStudyCategory === '자격증' || newStudyCategory === '어학') && (
                <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-xs font-bold text-slate-700">세부 정보 (시험)</div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500">원서 접수일</span>
                      <input type="date" value={newStudyDetails.applyDate || ''} onChange={e => setNewStudyDetails({...newStudyDetails, applyDate: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 bg-white" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500">시험일</span>
                      <input type="date" value={newStudyDetails.examDate || ''} onChange={e => setNewStudyDetails({...newStudyDetails, examDate: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 bg-white" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500">목표 점수/등급</span>
                      <input type="text" placeholder="예: 80점, IH" value={newStudyDetails.targetScore || ''} onChange={e => setNewStudyDetails({...newStudyDetails, targetScore: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500">응시료</span>
                      <input type="text" placeholder="예: 45000" value={newStudyDetails.examFee || ''} onChange={e => setNewStudyDetails({...newStudyDetails, examFee: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500" />
                    </div>
                  </div>
                </div>
              )}

              {newStudyCategory === '독서' && (
                <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-xs font-bold text-slate-700">세부 정보 (독서)</div>
                  <div>
                    <span className="text-[10px] text-slate-500">저자</span>
                    <input type="text" placeholder="예: 로버트 C. 마틴" value={newStudyDetails.author || ''} onChange={e => setNewStudyDetails({...newStudyDetails, author: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 mt-1" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={newStudyDetails.isReadingStatusOnly || false} onChange={e => setNewStudyDetails({...newStudyDetails, isReadingStatusOnly: e.target.checked})} className="accent-sky-500" />
                      페이지 입력 대신 '읽는 중' 상태로만 관리하기
                    </label>
                  </div>
                  {!newStudyDetails.isReadingStatusOnly && (
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500">총 페이지 수</span>
                        <input type="number" placeholder="예: 300" value={newStudyDetails.totalPages || ''} onChange={e => setNewStudyDetails({...newStudyDetails, totalPages: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500">현재 페이지</span>
                        <input type="number" placeholder="예: 45" value={newStudyDetails.currentPage || ''} onChange={e => setNewStudyDetails({...newStudyDetails, currentPage: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {newStudyCategory === '코딩' && (
                <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-xs font-bold text-slate-700">세부 정보 (코딩/프로젝트)</div>
                  <div>
                    <span className="text-[10px] text-slate-500">레포지토리 URL</span>
                    <input type="text" placeholder="https://github.com/..." value={newStudyDetails.repoUrl || ''} onChange={e => setNewStudyDetails({...newStudyDetails, repoUrl: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 mt-1" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">기술 스택 (쉼표로 구분)</span>
                    <input type="text" placeholder="React, Node.js, Tailwind..." value={newStudyDetails.techStack || ''} onChange={e => setNewStudyDetails({...newStudyDetails, techStack: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 mt-1" />
                  </div>
                </div>
              )}

              {newStudyCategory === '운동' && (
                <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-xs font-bold text-slate-700">세부 정보 (운동)</div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500">운동 종목</span>
                      <input type="text" placeholder="예: 헬스, 러닝, 필라테스" value={newStudyDetails.exerciseType || ''} onChange={e => setNewStudyDetails({...newStudyDetails, exerciseType: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 bg-white" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500">목표 수치</span>
                      <input type="text" placeholder="예: 골격근량 30kg, 체지방 15%" value={newStudyDetails.targetWeight || ''} onChange={e => setNewStudyDetails({...newStudyDetails, targetWeight: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 bg-white" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowAddStudyModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors">취소</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded transition-colors shadow-sm">{editingStudy ? '수정하기' : '추가하기'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Study Details Modal (with Todo integration) */}
      {selectedStudyForDetails && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-[500px] shadow-2xl border border-slate-100 max-h-[90vh] overflow-auto flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded leading-none mb-1 inline-block">{selectedStudyForDetails.category}</span>
                <h2 className="text-xl font-bold text-slate-800">{selectedStudyForDetails.title}</h2>
                <div className="text-xs text-slate-500 mt-1">목표일: {selectedStudyForDetails.target_date || '없음'}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowAddStudyModal(false); openStudyModal(selectedStudyForDetails) }} className="text-slate-400 hover:text-sky-500 transition-colors"><Pencil className="w-4 h-4"/></button>
                <button onClick={() => deleteStudy(selectedStudyForDetails.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                <button onClick={() => setSelectedStudyForDetails(null)} className="text-slate-400 hover:text-slate-600 transition-colors ml-2"><span className="text-xl leading-none">&times;</span></button>
              </div>
            </div>

            {(() => {
              if (!selectedStudyForDetails.details) return null;
              try {
                const details = JSON.parse(selectedStudyForDetails.details);
                if (Object.keys(details).length === 0) return null;

                if (selectedStudyForDetails.category === '학점은행제') {
                  return (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-bold text-slate-700">과목 리스트 ({(details.subjects || []).length}과목)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                        {(details.subjects || []).map((sub: any) => (
                          <div key={sub.id} className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col gap-2">
                            <div className="font-semibold text-sm text-slate-800 break-keep">{sub.name} {sub.lectureCount && <span className="text-[10px] font-normal text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded ml-1">{sub.lectureCount}강</span>}</div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] mt-auto">
                              <div className="flex flex-col"><span className="text-slate-400">중간고사</span><span className="font-medium text-slate-700">{sub.midtermDate || '-'}</span></div>
                              <div className="flex flex-col"><span className="text-slate-400">기말고사</span><span className="font-medium text-slate-700">{sub.finalDate || '-'}</span></div>
                              <div className="flex flex-col col-span-2"><span className="text-slate-400">과제 제출일</span><span className="font-medium text-slate-700">{sub.assignmentDate || '-'}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (selectedStudyForDetails.category === '독서') {
                  if (details.isReadingStatusOnly) {
                     return <div className="bg-sky-50 p-3 rounded border border-sky-100 text-sm text-sky-700 flex items-center gap-2 font-medium"><BookOpen className="w-4 h-4"/> 열심히 읽는 중!</div>;
                  }
                  const total = Number(details.totalPages) || 1;
                  const current = Number(details.currentPage) || 0;
                  const pct = Math.min(100, Math.round((current / total) * 100));
                  return (
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col gap-2">
                      {details.author && <div className="text-xs mb-1 text-slate-600">저자: <span className="font-medium">{details.author}</span></div>}
                      <div className="flex justify-between text-xs"><span className="text-slate-500">독서 진행률</span><span className="font-bold text-sky-600">{pct}% ({current} / {total}p)</span></div>
                      <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-sky-500 h-2 rounded-full transition-all" style={{width: `${pct}%`}}></div></div>
                    </div>
                  );
                }

                // Default (자격증, 코딩, 운동 등)
                const labels: any = { applyDate: '접수일', examDate: '시험일', targetScore: '목표점수', examFee: '응시료', author: '저자', repoUrl: '레포지토리 URL', techStack: '기술 스택', exerciseType: '운동 종목', targetWeight: '목표 수치' };
                return (
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(details).filter(([k, v]) => v && k !== 'isReadingStatusOnly').map(([k, v]) => {
                      const isUrl = k === 'repoUrl';
                      return (
                        <div key={k} className="flex flex-col">
                          <span className="text-slate-400 font-medium">{labels[k] || k}</span>
                          {isUrl ? (
                            <a href={String(v)} target="_blank" rel="noreferrer" className="text-sky-500 font-semibold break-all hover:underline">{String(v)}</a>
                          ) : (
                            <span className="text-slate-700 font-semibold break-all">{String(v)}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                );
              } catch(e) { return null; }
            })()}

            <div className="border-t border-slate-100 pt-4 mt-2">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1">관련 할 일 (Todo)</h3>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-auto pr-2 mb-3">
                {todos.filter(t => t.study_id === selectedStudyForDetails.id).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">아직 등록된 할 일이 없습니다.</p>
                ) : (
                  todos.filter(t => t.study_id === selectedStudyForDetails.id).map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-sm group">
                      <button
                        onClick={() => toggleTodo(item)}
                        className={`w-4 h-4 mt-0.5 shrink-0 rounded-sm border flex items-center justify-center ${item.done ? 'bg-sky-400 border-sky-400 text-white' : 'bg-white border-slate-300'}`}
                      >
                        {item.done && <CheckSquare className="w-3 h-3" />}
                      </button>
                      <span className={`${item.done ? 'line-through text-slate-400' : 'text-slate-700'} flex-1`}>
                        {item.text}
                      </span>
                      <button onClick={() => deleteTodo(item.id, item.study_id)} className="p-1 text-slate-300 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={saveStudyTodo} className="flex gap-2">
                <input 
                  type="text" 
                  value={studyTodoInput} 
                  onChange={e => setStudyTodoInput(e.target.value)} 
                  placeholder="이 목표에 해당하는 할 일 추가..." 
                  className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-sky-500" 
                />
                <button type="submit" className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs hover:bg-slate-700 transition-colors">추가</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}