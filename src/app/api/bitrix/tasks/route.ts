import { NextResponse } from 'next/server';

const HOOKS = {
  vicekeeper: {
    url: 'https://btx24vk.vicekeeper.com/rest/37053/e19lj93rot0jbuvt/',
    userId: 37053
  },
  linion: {
    url: 'https://corp.linion.pro/rest/439/mdkjg8be7s6eosb9/',
    userId: 439
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company') as keyof typeof HOOKS;

  if (!company || !HOOKS[company]) {
    return NextResponse.json({ error: 'Unknown Identity' }, { status: 400 });
  }

  const hook = HOOKS[company];

  try {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const response = await fetch(`${hook.url}tasks.task.list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: {
          RESPONSIBLE_ID: hook.userId,
          '<=DEADLINE': todayEnd.toISOString(),
          '!=STATUS': 5,
        },
        select: ['ID', 'TITLE', 'DEADLINE']
      })
    });

    const data = await response.json();
    return NextResponse.json({ tasks: data.result?.tasks || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Bitrix Sync Failed' }, { status: 500 });
  }
}
