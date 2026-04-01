import { NextResponse } from 'next/server';

// Сюда нужно будет вписать твои данные
const ASANA_PAT = 'YOUR_ASANA_PERSONAL_ACCESS_TOKEN';
const WORKSPACE_ID = 'YOUR_WORKSPACE_GID';
const ASSIGNEE_ID = 'YOUR_ASSIGNEE_GID';

export async function GET() {
  if (ASANA_PAT === 'YOUR_ASANA_PERSONAL_ACCESS_TOKEN') {
    return NextResponse.json({ error: 'Asana Token Missing' }, { status: 401 });
  }

  try {
    const now = new Date();
    const day = now.getDay() || 7; // 1-7
    
    // Начало недели (понедельник)
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    monday.setHours(0,0,0,0);

    // Конец недели (воскресенье)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    const url = `https://app.asana.com/api/1.0/tasks?assignee=${ASSIGNEE_ID}&workspace=${WORKSPACE_ID}&due_on.after=${monday.toISOString()}&due_on.before=${sunday.toISOString()}&opt_fields=name,due_on,completed`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ASANA_PAT}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    // Фильтруем только незавершенные задачи
    const activeTasks = (data.data || []).filter((t: any) => !t.completed);

    return NextResponse.json({ tasks: activeTasks });
  } catch (error) {
    return NextResponse.json({ error: 'Asana Sync Failed' }, { status: 500 });
  }
}
