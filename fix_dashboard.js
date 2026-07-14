const fs = require('fs');
const content = fs.readFileSync('src/Dashboard.tsx', 'utf8');

const replacement = `  const currentMonthExpense = currentMonthBudgets.filter(b => Number(b.amount) < 0).reduce((acc, b) => acc + Number(b.amount), 0)

  return (
    <div className="w-full">
      <main className="dashboard-container">
        <div className="flex flex-col gap-4">
          {/* Calendar Box */}
        <div className="content-box">
          <h2 className="section-title flex justify-between items-center">
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
                      <div className={\`w-1.5 h-1.5 rounded-full \${study.color || 'bg-sky-500'}\`}></div>
                      <span>{study.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Todo & Schedule Box */}
          <div className="content-box flex flex-col h-[350px]">
            <h2 className="section-title flex justify-between items-center mb-2">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-4 h-4 text-sky-400" />
                Plan ({format(selectedDate, 'M/d')})
              </span>
              {editingTodo && rightPaneTab === 'todo' && (
                <button onClick={() => { setEditingTodo(null); setNewTodo(''); setSelectedStudyId('') }} className="text-xs text-slate-400 hover:text-slate-600">취소</button>
              )}
            </h2>
            <div className="flex gap-2 mb-3 shrink-0">
              <button onClick={() => setRightPaneTab('todo')} className={\`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all \${rightPaneTab === 'todo' ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>To-Do</button>
              <button onClick={() => setRightPaneTab('schedule')} className={\`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all \${rightPaneTab === 'schedule' ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>Timeline</button>
            </div>
            
            {rightPaneTab === 'todo' ? (
              <div className="flex-1 overflow-auto mb-2 min-h-0">
                <ul className="flex flex-col gap-2 pr-2">
                  {selectedTodos.length === 0 ? (
                    <li className="text-sm text-slate-400 text-center py-4">일정이 없습니다.</li>
                  ) : (
                    selectedTodos.map(item => (
                      <li key={item.id} className="flex items-start justify-between gap-2 text-sm group border-b border-slate-50 pb-2">
                        <div className="flex items-start gap-2 max-w-[80%]">
                          <button
                            onClick={() => toggleTodo(item)}
                            className={\`w-4 h-4 mt-0.5 shrink-0 rounded-sm border flex items-center justify-center \${item.done ? 'bg-sky-400 border-sky-400 text-white' : 'bg-white border-slate-300'}\`}
                          >
                            {item.done && <CheckSquare className="w-3 h-3" />}
                          </button>
                          <div className="flex flex-col">
                            <span className={\`\${item.done ? 'line-through text-slate-400' : 'text-slate-700'}\`}>
                              {item.text}
                            </span>
                            {item.study_id && (
                              <span className="text-[10px] text-sky-500 font-medium">연동: {studies.find(s => s.id === item.study_id)?.title}</span>
                            )}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                          <button onClick={() => {
                            setEditingTodo(item.id);
                            setNewTodo(item.text);
                            setSelectedStudyId(item.study_id || '');
                          }} className="p-1 text-slate-300 hover:text-sky-500"><Pencil className="w-3 h-3"/></button>
                          <button onClick={() => deleteTodo(item.id)} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-3 h-3"/></button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : (
              <div className="flex-1 overflow-auto mb-2 min-h-0 pl-1">
                <div className="relative border-l-2 border-slate-100 ml-2 space-y-4 pb-2">
                  {schedules.filter(s => s.date === selectedDateStr).length === 0 ? (
                    <div className="text-sm text-slate-400 text-center py-4 -ml-2">타임라인 일정이 없습니다.</div>
                  ) : (
                    schedules.filter(s => s.date === selectedDateStr).map(item => (
                      <div key={item.id} className="relative pl-4 group">
                        <div className={\`absolute -left-[5px] top-1 w-2 h-2 rounded-full border-2 border-white \${item.color || 'bg-sky-400'}\`}></div>
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            {item.time && <span className="text-[10px] font-bold text-slate-400">{item.time}</span>}
                            <span className="text-sm text-slate-700">{item.title}</span>
                          </div>
                          <button onClick={() => {
                            fetchAPI(\`/schedules/\${item.id}\`, { method: 'DELETE' }).then(() => fetchSchedules())
                          }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-3 h-3"/></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {rightPaneTab === 'todo' ? (
              <form onSubmit={addTodo} className="mt-auto shrink-0 flex flex-col gap-2">
                <select value={selectedStudyId} onChange={e => setSelectedStudyId(e.target.value)} className="w-full text-xs text-slate-500 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-sky-400 bg-slate-50">
                  <option value="">(연동 안함)</option>
                  {studies.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTodo}
                    onChange={e => setNewTodo(e.target.value)}
                    placeholder="새 할 일을 입력하세요..."
                    className="flex-1 text-sm border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-sky-400 transition-colors"
                  />
                  <button type="submit" className="shrink-0 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors shadow-sm">
                    {editingTodo ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={addSchedule} className="mt-auto shrink-0 flex flex-col gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                <div className="flex gap-2">
                  <input type="time" value={newSchedule.time} onChange={e => setNewSchedule({...newSchedule, time: e.target.value})} className="w-24 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-sky-400" />
                  <input type="text" value={newSchedule.title} onChange={e => setNewSchedule({...newSchedule, title: e.target.value})} placeholder="일정 제목" className="flex-1 min-w-0 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-sky-400" required />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1">
                    {['bg-sky-400', 'bg-rose-400', 'bg-emerald-400', 'bg-amber-400', 'bg-purple-400'].map(color => (
                      <button key={color} type="button" onClick={() => setNewSchedule({...newSchedule, color})} className={\`w-4 h-4 rounded-full \${color} \${newSchedule.color === color ? 'ring-2 ring-offset-1 ring-slate-400' : ''}\`}></button>
                    ))}
                  </div>
                  <button type="submit" className="ml-auto bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors shadow-sm">추가</button>
                </div>
              </form>
            )}
          </div>

          <div className="content-box flex flex-col h-[350px]">
            <h2 className="section-title flex justify-between items-center mb-2">
              <span className="flex items-center gap-1">
                <Flag className="w-4 h-4 text-rose-400" />
                Goals & Studies
              </span>
              <button onClick={() => setShowAddStudyModal(true)} className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded hover:bg-sky-100 flex items-center gap-1">
                <Plus className="w-3 h-3" /> 목표
              </button>
            </h2>
            <div className="flex-1 overflow-auto min-h-0">
              <div className="grid grid-cols-1 gap-2 pr-1">
                {studies.length === 0 && <p className="text-center text-slate-400 text-sm py-4">등록된 목표가 없습니다.</p>}
                {studies.map(study => (
                  <div key={study.id} className="group relative bg-white border border-[#ddedf8] rounded-lg p-3 hover:border-sky-200 transition-colors cursor-pointer" onClick={() => setSelectedStudyForDetails(study)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={\`w-2.5 h-2.5 rounded-full \${study.color || 'bg-sky-500'}\`}></div>
                        <h3 className="font-bold text-sm text-slate-800">{study.title}</h3>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{study.category || '기타'}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteStudy(study.id); }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                    </div>
                    {study.target_date && (
                      <div className="text-xs text-slate-500 mb-2 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">
                        목표일: {study.target_date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="section-group">
            <div className="title-box">
              Contents
            </div>
            <div className="content-box sky-tint flex-1">
              <h2 className="title-inline">
                <BookOpen className="w-4 h-4" />
                Contents
              </h2>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['웹툰', '웹소설', '애니', '영화', '드라마', '만화', '소설', '전대물'].map(type => (
                  <button key={type} onClick={() => navigate(\`/contents?type=\${type}\`)} className="px-3 py-1 bg-[#ffffff] text-slate-600 text-xs rounded hover:bg-slate-50 hover:text-[#111] border border-[#c8e2f5] transition-colors">{type}</button>
                ))}
              </div>
            </div>
            
            <div className="content-box sky-tint flex-1">
              <h2 className="title-inline">
                <MusicIcon className="w-4 h-4" />
                Music
              </h2>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['앨범', 'EP', '싱글'].map(type => (
                  <button key={type} onClick={() => navigate(\`/music?type=\${type}\`)} className="px-3 py-1 bg-[#ffffff] text-slate-600 text-xs rounded hover:bg-slate-50 hover:text-[#111] border border-[#c8e2f5] transition-colors">{type}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="section-group">
            <div className="title-box">
              Budget
            </div>
            <div className="content-box flex flex-col" style={{ height: 'calc(400px - 40px)' }}>
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
                        <span className="text-slate-700 text-xs">{b.method ? \`[\${b.method}] \` : ''}{b.category}</span>
                        <span className="text-[10px] text-slate-400">{b.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={\`font-semibold text-xs\`} style={{ color: Number(b.amount) > 0 ? '#5BB5D5' : '#8ECAE6' }}>
                          {Number(b.amount) > 0 ? '+' : ''}{Number(b.amount).toLocaleString()}
                        </span>
                        <button onClick={() => deleteBudget(b.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500"><Trash2 className="w-3 h-3"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={addBudget} className="mt-auto shrink-0 flex flex-col gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                <div className="flex gap-2 mb-1">
                  <button type="button" onClick={() => handleBudgetTypeChange('expense')} className={\`flex-1 py-1 text-xs rounded transition-colors \${budgetType === 'expense' ? 'bg-sky-400 text-white' : 'bg-white text-slate-500 border border-slate-200'}\`}>지출</button>
                  <button type="button" onClick={() => handleBudgetTypeChange('income')} className={\`flex-1 py-1 text-xs rounded transition-colors \${budgetType === 'income' ? 'bg-sky-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}\`}>수입</button>
                </div>
                
                <div className="flex gap-2">
                  {budgetType === 'expense' && (
                    <div className="relative flex-1 min-w-0">
                      <select value={newBudget.method} onChange={e => setNewBudget({...newBudget, method: e.target.value})} className="appearance-none w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 pr-8 focus:outline-none focus:border-sky-400 text-slate-600 cursor-pointer">
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
                
                <div className="flex gap-2">
                  <input type="text" value={newBudget.amount} onChange={e => {
                    const rawVal = e.target.value.replace(/[^0-9]/g, '')
                    setNewBudget({...newBudget, amount: rawVal ? Number(rawVal).toLocaleString() + ' 원' : ''})
                  }} placeholder="금액" className="flex-1 min-w-0 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-sky-400" />
                  <input type="date" value={newBudget.date} onChange={e => setNewBudget({...newBudget, date: e.target.value})} className="flex-1 min-w-0 text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-sky-400 bg-white" />
                  <button type="submit" className="w-16 shrink-0 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium py-1.5 rounded transition-colors">추가</button>
                </div>
              </form>
            </div>

            <div className="content-box flex flex-col h-[350px]">
              <h2 className="section-title flex justify-between items-center">
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
                    className={\`shrink-0 px-3 py-1 text-xs rounded-full transition-colors border \${selectedMemoGroup === mg.id ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-500 border-[#ddedf8] hover:bg-sky-50'}\`}
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
                  placeholder="새 메모 추가..."
                  className="w-full text-sm border border-slate-200 rounded-full px-4 py-2 pr-12 focus:outline-none focus:border-sky-400 shadow-sm"
                  disabled={!selectedMemoGroup}
                />
                <button type="submit" disabled={!selectedMemoGroup} className="absolute right-1.5 top-1.5 p-1 text-sky-500 hover:bg-sky-50 rounded-full disabled:opacity-50 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Add Study Modal */}
      {showAddStudyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] shadow-2xl border border-slate-100 max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">새 목표 / 스터디 추가</h2>
            <form onSubmit={addStudy} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">제목</label>
                  <input type="text" value={newStudyTitle} onChange={e => setNewStudyTitle(e.target.value)} required className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500" placeholder="예: 정보처리기사 실기" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">카테고리</label>
                  <select value={newStudyCategory} onChange={e => setNewStudyCategory(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500">
                    {['자격증', '전공', '교양', '어학', '개인프로젝트', '기타'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* 학점 연동 스터디 (전공/교양) */}
              {(newStudyCategory === '전공' || newStudyCategory === '교양') && (
                <div className="border border-sky-100 bg-sky-50/30 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-700">과목 및 평가 설정 (학점 관리)</label>
                    <button type="button" onClick={() => setAcademicSubjects([...academicSubjects, { name: '', tests: '' }])} className="text-[10px] bg-white border border-sky-200 text-sky-600 px-2 py-0.5 rounded hover:bg-sky-50">+ 과목 추가</button>
                  </div>
                  {academicSubjects.map((subject, idx) => (
                    <div className="flex items-start gap-2 mt-1.5" key={idx}>
                      <div className="flex-1 flex flex-col gap-1.5">
`;

const updated = content.replace(
  "  const currentMonthExpense = currentMonthBudgets.filter(b => Number(b.amount) < 0).reduce((acc, b) => acc + Number(b.amount), 0)",
  replacement
);

fs.writeFileSync('src/Dashboard.tsx', updated);
