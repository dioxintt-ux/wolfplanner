'use client';

import { useState, useEffect } from 'react';

type Company = {
  id: string;
  name: string;
  color: string;
};

type Task = {
  id: string;
  title: string;
  startTime: string;
  duration: number;
  companyId: string | null;
  company?: Company;
  isDone: boolean;
  isBreak: boolean;
  targetDate: string;
};

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);
const NEON_COLORS = ['#00f2ff', '#7d26ff', '#00ff9d', '#ff8c00', '#ff00f2', '#f2ff00', '#ff4444'];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('10:00');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [manageCompany, setManageCompany] = useState<Company | null>(null);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<{ type: 'new' | 'edit' | 'break', current: string } | null>(null);
  const [bitrixTasks, setBitrixTasks] = useState<any[]>([]);
  const [linionTasks, setLinionTasks] = useState<any[]>([]);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCompId, setEditCompId] = useState('');
  const [compName, setCompName] = useState('');
  const [compColor, setCompColor] = useState(NEON_COLORS[0]);
  
  const [breakStart, setBreakStart] = useState('14:00');
  const [breakDuration, setBreakDuration] = useState(30);
  const [activeSettingsTab, setActiveSettingsTab] = useState('recharge');

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = () => {
    fetch(`/api/tasks?date=${currentDate}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setTasks(data.tasks || []);
          setCompanies(data.companies || []);
          if (data.companies?.length > 0 && !selectedCompanyId) {
            setSelectedCompanyId(data.companies[0].id);
          }
        }
      });
      
    fetch(`/api/bitrix/tasks?company=vicekeeper`).then(res => res.json()).then(data => {
      if (!data.error) setBitrixTasks(data.tasks || []);
    });

    fetch(`/api/bitrix/tasks?company=linion`).then(res => res.json()).then(data => {
      if (!data.error) setLinionTasks(data.tasks || []);
    });

  };

  useEffect(() => {
    if (isMounted) fetchData();
  }, [currentDate, isMounted]);

  const toggleTask = async (task: Task) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isDone: !task.isDone })
    });
    const updated = await res.json();
    if (!updated.error) setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
  };

  const addTask = async (isBreak = false, customTitle?: string, customTime?: string) => {
    const payload = isBreak 
      ? { title: 'RECHARGE PROTOCOLS', startTime: breakStart, duration: breakDuration, isBreak: true, targetDate: currentDate }
      : { title: customTitle || newTaskTitle, startTime: customTime || newTaskTime, companyId: selectedCompanyId, targetDate: currentDate };

    if (!isBreak && (!payload.title || !selectedCompanyId)) return;
    
    const res = await fetch('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
    if (res.ok) {
      fetchData();
      if (!isBreak && !customTitle) setNewTaskTitle('');
    }
  };

  const updateTaskDetails = async () => {
    if (!editingTask) return;
    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: editTitle, startTime: editTime, companyId: editCompId })
    });
    if (res.ok) {
      fetchData();
      setEditingTask(null);
    }
  };

  const handleTaskDrop = async (taskId: string, newHour: number, isExternal = false, externalTitle?: string, externalSource?: 'vicekeeper' | 'linion') => {
    if (isExternal && externalTitle) {
      const newTime = `${newHour.toString().padStart(2, '0')}:00`;
      let targetId = selectedCompanyId;
      
      if (externalSource === 'linion') targetId = companies.find(c => c.name.toLowerCase().includes('linion'))?.id || targetId;
      else if (externalSource === 'vicekeeper') targetId = companies.find(c => c.name.toLowerCase().includes('vicekeeper'))?.id || targetId;
      
      addExternalTask(externalTitle, newTime, targetId);
      return;
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newTime = `${newHour.toString().padStart(2, '0')}:00`;
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ startTime: newTime })
    });
    if (res.ok) fetchData();
  };

  const addExternalTask = async (title: string, time: string, companyId: string) => {
    const res = await fetch('/api/tasks', { 
      method: 'POST', 
      body: JSON.stringify({ title, startTime: time, companyId, targetDate: currentDate }) 
    });
    if (res.ok) fetchData();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Confirm Delete?")) return;
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
      setEditingTask(null);
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  if (!isMounted) return null;

  const timeStr = currentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dayProgress = (() => {
    const start = 10 * 60, end = 19 * 60, now = currentTime.getHours() * 60 + currentTime.getMinutes();
    return now < start ? 0 : now > end ? 100 : ((now - start) / (end - start)) * 100;
  })();
  const formattedDate = new Date(currentDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const activeBreak = tasks.find(t => {
    if (!t.isBreak) return false;
    const [h, m] = t.startTime.split(':').map(Number);
    const start = h * 60 + m;
    const end = start + (t.duration || 30);
    return currentMinutes >= start && currentMinutes < end;
  });

  return (
    <div className={`wolf-container ${activeBreak ? 'break-locked' : ''}`}>
      <div className="live-bg" style={{ 
        backgroundImage: "url('/Users/daniilchugunnikov/.gemini/antigravity/brain/6eef6bfa-f89a-4c49-a037-f4d9a9bfc0d4/wolfplanner_live_bg_1774945536494.png')",
        position: 'fixed', top:0, left:0, width:'100%', height:'100%', zIndex: 0, opacity: 0.45, backgroundSize:'cover' 
      }}></div>
      
      <div className="ultra-progress"><div className="fill" style={{ width: `${dayProgress}%` }}></div></div>

      {activeBreak && (
        <div className="system-break-overlay">
          <div className="recharge-core">
            <h2 className="apple-bold-title">RECHARGE MODE</h2>
            <div className="recharge-spinner"></div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="apple-modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="settings-shell apple-glass-ultra" onClick={e => e.stopPropagation()}>
            <div className="settings-sidebar">
              <h2>SYSTEM</h2>
              <button className={`settings-tab-btn ${activeSettingsTab === 'recharge' ? 'active' : ''}`} onClick={() => setActiveSettingsTab('recharge')}>☕ Recharge</button>
            </div>
            <div className="settings-content">
              <h3 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Recharge Protocols</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <label className="l-apple">START TIME</label>
                  <input type="time" className="input-apple" value={breakStart} onChange={e => setBreakStart(e.target.value)} />
                </div>
                <div>
                  <label className="l-apple">DURATION</label>
                  <input type="number" className="input-apple" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} />
                </div>
              </div>
              <button className="btn-apple-solid" style={{ marginTop: '3rem' }} onClick={() => addTask(true)}>Activate Proto</button>
            </div>
          </div>
        </div>
      )}

      {(manageCompany || isAddingCompany) && (
        <div className="apple-modal-overlay" onClick={() => { setManageCompany(null); setIsAddingCompany(false); }}>
          <div className="modal-shell-clean apple-glass-ultra" onClick={e => e.stopPropagation()}>
            <h2 className="modal-head-clean">{isAddingCompany ? 'Add Employer' : 'Employer Profile'}</h2>
            <div style={{ padding: '2rem 0' }}>
              <label className="l-apple">BRAND NAME</label>
              <input type="text" className="input-apple" value={compName} onChange={e => setCompName(e.target.value)} style={{ marginBottom: '2rem' }} />
              <label className="l-apple">SYSTEM COLOR</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                {NEON_COLORS.map(color => (
                  <div key={color} onClick={() => setCompColor(color)} style={{ width: '34px', height: '34px', borderRadius: '50%', background: color, cursor: 'pointer', border: compColor === color ? '3px solid #fff' : 'none' }}></div>
                ))}
              </div>
              <button className="btn-apple-solid" onClick={isAddingCompany ? (() => { 
                if (!compName) return; 
                fetch('/api/companies', { method: 'POST', body: JSON.stringify({ name: compName, color: compColor }) }).then(() => { fetchData(); setIsAddingCompany(false); }) 
              }) : (() => {
                fetch(`/api/companies/${manageCompany!.id}`, { method: 'PATCH', body: JSON.stringify({ name: compName, color: compColor }) }).then(()=>fetchData()); setManageCompany(null);
              })}>Save Employer Data</button>
              {!isAddingCompany && <button className="btn-apple-hazard-ghost" style={{ marginTop: '1rem' }} onClick={() => { if(confirm("Erase data?")) { fetch(`/api/companies/${manageCompany!.id}`, {method: 'DELETE'}).then(()=>fetchData()); setManageCompany(null); } }}>Remove Employer</button>}
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="apple-modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-shell-clean apple-glass-ultra" onClick={e => e.stopPropagation()}>
            <h2 className="modal-head-clean">Mission Data</h2>
            <div style={{ padding: '2rem 0' }}>
              <label className="l-apple">OBJECTIVE TITLE</label>
              <input type="text" className="input-apple" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ marginBottom: '2rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                <div>
                  <label className="l-apple">TIME</label>
                  <input type="time" className="input-apple" value={editTime} onChange={e => setEditTime(e.target.value)} />
                </div>
                {!editingTask.isBreak && (
                  <div>
                    <label className="l-apple">EMPLOYER</label>
                    <select className="input-apple" value={editCompId} onChange={e => setEditCompId(e.target.value)}>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button className="btn-apple-solid" onClick={updateTaskDetails}>Confirm Project Changes</button>
              <button className="btn-apple-hazard-ghost" style={{ marginTop: '1rem' }} onClick={() => deleteTask(editingTask.id)}>Remove Mission</button>
            </div>
          </div>
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', position: 'relative', zIndex: 2 }}>
        <div>
          <h1 className="apple-title-logo" style={{ fontSize: '2.5rem', fontWeight: 900 }}>WOLFPLANNER</h1>
          <div className="date-wheel-navigator" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '10px' }}>
            <button className="wheel-nav-btn" onClick={() => shiftDate(-1)}>‹</button>
            <div className="date-display-pill" style={{ padding: '0 15px', fontWeight: 800 }}>
              <span>{formattedDate}</span>
              <input type="date" className="date-abs-input" value={currentDate} onChange={e => setCurrentDate(e.target.value)} style={{ position:'absolute', opacity:0 }} />
            </div>
            <button className="wheel-nav-btn" onClick={() => shiftDate(1)}>›</button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button className="gear-trigger-refined" onClick={() => setIsSettingsOpen(true)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', opacity: 0.2, cursor: 'pointer' }}>⚙</button>
          <div className="clock-capsule apple-glass-ultra" style={{ padding: '0.8rem 1.8rem', borderRadius: '15px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{timeStr}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '3rem', position: 'relative', zIndex: 2 }}>
        <aside>
          <section className="side-card apple-glass-ultra" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="section-tab-label">PARTNERS</h3>
              <button className="plus-btn" onClick={() => { setIsAddingCompany(true); setCompName(''); setCompColor(NEON_COLORS[0]); }}>+</button>
            </div>
            <div className="partner-list" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {companies.map(c => {
                const isExpanded = expandedPartnerId === c.id;
                const isVice = c.name.toLowerCase().includes('vicekeeper');
                const isLinion = c.name.toLowerCase().includes('linion');
                const hasTasks = isVice || isLinion;
                const sourceTasks = isVice ? bitrixTasks : (isLinion ? linionTasks : []);

                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden' }}>
                    <div onClick={() => setSelectedCompanyId(c.id)} className={`partner-item ${selectedCompanyId === c.id ? 'active' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: selectedCompanyId === c.id ? '#fff' : 'transparent', color: selectedCompanyId === c.id ? '#000' : '#fff', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="p-accent" style={{ width: '3px', height: '16px', background: c.color }}></div>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{c.name.toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        {hasTasks && (
                          <button onClick={(e) => { e.stopPropagation(); setExpandedPartnerId(isExpanded ? null : c.id); }} style={{ background: 'transparent', border: 'none', color: 'inherit', padding: '5px', cursor: 'pointer', opacity: 0.5, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: '0.3s' }}>
                            ▶
                          </button>
                        )}
                        <button className="mini-gear" onClick={(e) => { e.stopPropagation(); setManageCompany(c); setCompName(c.name); setCompColor(c.color); }}>⚙</button>
                      </div>
                    </div>
                    
                    {isExpanded && hasTasks && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)', maxHeight: '250px', overflowY: 'auto' }}>
                        {sourceTasks.length === 0 && <p style={{ opacity: 0.2, fontSize: '0.6rem', textAlign: 'center', padding: '10px' }}>No active targets.</p>}
                        {sourceTasks.map(bt => (
                          <div key={bt.id} draggable onDragStart={e => { e.dataTransfer.setData('externalTitle', bt.title); e.dataTransfer.setData('externalSource', isVice ? 'vicekeeper' : 'linion'); e.dataTransfer.setData('isExternal', 'true'); }} className="bitrix-node-mini" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '5px', cursor: 'grab', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h5 style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.9 }}>{bt.title}</h5>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          

          <section className="side-card apple-glass-ultra" style={{ marginTop: '2rem', padding: '2rem' }}>
            <h3 className="section-tab-label" style={{ marginBottom: '1rem' }}>DEPLOY OBJECTIVE</h3>
            <input type="text" placeholder="Mission details..." className="input-apple" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} style={{ marginBottom: '1rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <input type="time" className="input-apple" value={newTaskTime} onChange={e => setNewTaskTime(e.target.value)} />
              <button className="btn-apple-solid" style={{ height: '60px' }} onClick={() => addTask(false)}>Deploy</button>
            </div>
          </section>
        </aside>

        <main className="timeline-refined apple-glass-ultra" style={{ padding: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
            <h2 className="pulse-title" style={{ fontSize: '3rem', fontWeight: 900 }}>Pulse</h2>
          </div>

          <div className="hour-atlas">
            {ALL_HOURS.map(hour => {
              const hourTasks = tasks.filter(t => parseInt(t.startTime.split(':')[0]) === hour);
              const isWorkRange = hour >= 10 && hour < 20;
              const hasTasks = hourTasks.length > 0;
              if (!isWorkRange && !hasTasks) return null;
              
              return (
                <div key={hour} 
                     className="hour-stripe" 
                     onDragOver={e => e.preventDefault()} 
                     onDrop={e => { 
                       const isExternal = e.dataTransfer.getData('isExternal') === 'true';
                       if (isExternal) {
                         const title = e.dataTransfer.getData('externalTitle');
                         const source = e.dataTransfer.getData('externalSource') as any;
                         handleTaskDrop('', hour, true, title, source);
                       } else {
                         const taskId = e.dataTransfer.getData('taskId'); 
                         handleTaskDrop(taskId, hour);
                       }
                     }}>
                  <label className="hour-stamp">{hour.toString().padStart(2, '0')}:00</label>
                  <div className="task-runway">
                    {hourTasks.map(task => {
                      const projectColor = task.isBreak ? '#7d26ff' : (task.company?.color || '#fff');
                      return (
                        <div key={task.id} draggable={!task.isBreak} onDragStart={e => e.dataTransfer.setData('taskId', task.id)} style={{ borderLeftColor: projectColor, background: `linear-gradient(90deg, ${projectColor}15 0%, transparent 40%)` }} className={`apple-task-card ${task.isDone ? 'checked' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }} onClick={() => !task.isBreak && toggleTask(task)}>
                            <div className={`check-pill ${task.isDone ? 'active' : ''}`} style={{ borderColor: task.isDone ? projectColor : 'rgba(255,255,255,0.2)', backgroundColor: task.isDone ? projectColor : 'transparent' }}></div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '1.3rem', fontWeight: 800, textDecoration: task.isDone ? 'line-through' : 'none', opacity: task.isDone ? 0.4 : 1 }}>{task.title}</h4>
                              <span style={{ fontSize: '0.7rem', opacity: 0.4, fontWeight: 700 }}>{task.isBreak ? 'RECHARGE' : `${task.company?.name || 'PRIVATE'} • ${task.startTime}`}</span>
                            </div>
                          </div>
                          <button className="t-gear" onClick={e => { e.stopPropagation(); setEditingTask(task); setEditTitle(task.title); setEditTime(task.startTime); setEditCompId(task.companyId || ''); }}>⚙</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <style jsx>{`
        .wolf-container { color: #fff; min-height: 100vh; position: relative; }
        .ultra-progress { position: fixed; top: 0; left: 0; width: 100%; height: 4px; z-index: 99999; background: rgba(255,255,255,0.02); }
        .ultra-progress .fill { height: 100%; background: #fff; box-shadow: 0 0 15px #fff; transition: 0.4s; }
        .apple-glass-ultra { background: rgba(255,255,255,0.03); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; }
        .apple-modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); }
        .modal-shell-clean { width: 500px; padding: 3rem; border-radius: 25px; }
        .input-apple { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); color: #fff; padding: 1rem; border-radius: 12px; width: 100%; outline: none; }
        .btn-apple-solid { background: #fff; color: #000; border: none; padding: 1rem; border-radius: 14px; font-weight: 800; width: 100%; cursor: pointer; }
        .btn-apple-hazard-ghost { background: transparent; color: #ff3b30; border: 1px solid rgba(255, 59, 48, 0.2); padding: 0.8rem; border-radius: 12px; width: 100%; cursor: pointer; }
        .hour-stripe { display: flex; gap: 2rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding: 1.5rem 0; min-height: 80px; }
        .hour-stamp { width: 60px; opacity: 0.2; font-weight: 800; font-size: 0.8rem; }
        .task-runway { flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .apple-task-card { display: flex; align-items: center; justify-content: space-between; padding: 1.2rem 1.8rem; border-radius: 15px; border-left: 6px solid #fff; transition: 0.2s; }
        .apple-task-card.checked { opacity: 0.5; }
        .check-pill { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; }
        .check-pill.active { background: #fff; border-color: #fff; position: relative; }
        .check-pill.active::after { content: "✓"; color: #000; position: absolute; font-size: 0.7rem; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: 900; }
        .mini-gear, .t-gear { background: transparent; border: none; color: #fff; opacity: 0.1; cursor: pointer; font-size: 1.2rem; }
        .partner-item:hover .mini-gear, .apple-task-card:hover .t-gear { opacity: 0.5; }
        .plus-btn { background: #fff; color: #000; border: none; width: 22px; height: 22px; border-radius: 50%; font-weight: 900; cursor: pointer; }
        .wheel-nav-btn { background: transparent; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; opacity: 0.3; }
        .recharge-spinner { width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
