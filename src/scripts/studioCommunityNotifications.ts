import {communityContinuation} from '../lib/studio/communityNavigation';

type Activity={
  id:string;
  post_id:string;
  reply_id:string;
  activity_type:string;
  chapter:string;
  capability:string;
  created_at:string;
  read_at:string|null;
};

const root=document.querySelector<HTMLElement>(
  '[data-community-notifications]'
);

if(root){
  const endpoint='/api/studio/community-activity';
  const list=root.querySelector<HTMLUListElement>(
    '[data-community-activity-list]'
  )!;
  const status=root.querySelector<HTMLElement>(
    '[data-community-activity-status]'
  )!;
  const count=root.querySelector<HTMLElement>(
    '[data-community-unread-count]'
  )!;

  const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  const chapters=new Set([
    'spark','foundation','architecture','expression',
    'visual-world','companion','making','into-the-world'
  ]);

  function destination(a:Activity):string|null{
    if(!uuid.test(a.post_id)||!chapters.has(a.chapter)){
      return null;
    }

    const base=a.capability==='general_community'
      ?'/studio/community/'
      :a.capability==='private_community'
        ?'/studio/private-community/'
        :null;

    return base?communityContinuation(a.capability==='general_community'?`${base}${a.chapter}/discussion/${a.post_id}/`:`${base}?chapter=${encodeURIComponent(a.chapter)}#discussion-${a.post_id}`,new URL(location.href).searchParams.get('from')):null;
  }

  async function acknowledge(id:string):Promise<boolean>{
    if(!uuid.test(id))return false;

    const form=new FormData();
    form.set('action','ack');
    form.set('activity_id',id);

    try{
      const response=await fetch(endpoint,{
        method:'POST',
        body:form,
        credentials:'same-origin',
        cache:'no-store',
        signal:AbortSignal.timeout(4000)
      });

      if(!response.ok)return false;

      const data=await response.json();
      return data.acknowledged===true;
    }catch{
      return false;
    }
  }

  async function load(){
    try{
      const response=await fetch(endpoint,{
        credentials:'same-origin',
        cache:'no-store'
      });

      if(!response.ok)throw Error('Unavailable');

      const data=await response.json();
      if(!Array.isArray(data.activities)||data.activities.length>2000){
        throw Error('Invalid activity response');
      }

      const activities:Activity[]=data.activities.filter(
        (a:unknown):a is Activity=>{
          if(!a||typeof a!=='object')return false;
          const v=a as Record<string,unknown>;
          return typeof v.id==='string'&&uuid.test(v.id)&&
            typeof v.post_id==='string'&&uuid.test(v.post_id)&&
            typeof v.reply_id==='string'&&uuid.test(v.reply_id)&&
            typeof v.activity_type==='string'&&
            typeof v.chapter==='string'&&chapters.has(v.chapter)&&
            (v.capability==='general_community'||
             v.capability==='private_community')&&
            typeof v.created_at==='string'&&
            (v.read_at===null||typeof v.read_at==='string');
        }
      );

      let unread=activities.filter(a=>a.read_at===null).length;

      function updateCount(){
        count.hidden=unread===0;
        count.textContent=unread?`${unread} unread`:'';
      }

      updateCount();
      list.replaceChildren();

      for(const activity of activities){
        const href=destination(activity);
        if(!href)continue;

        const item=document.createElement('li');
        item.dataset.unread=String(activity.read_at===null);

        const link=document.createElement('a');
        link.href=href;
        link.textContent=activity.capability==='private_community'
          ?'Private Community conversation'
          :'General Community conversation';

        const date=document.createElement('time');
        date.dateTime=activity.created_at;
        date.textContent=' '+new Date(activity.created_at)
          .toLocaleDateString('en-GB');

        item.append(link,date);
        list.append(item);

        link.addEventListener('click',async event=>{
          if(activity.read_at!==null)return;
          if(event.button!==0||event.ctrlKey||event.metaKey||
             event.shiftKey||event.altKey)return;

          event.preventDefault();
          link.setAttribute('aria-busy','true');

          try{
            const ok=await acknowledge(activity.id);
            if(ok){
              activity.read_at=new Date().toISOString();
              item.dataset.unread='false';
              unread=Math.max(0,unread-1);
              updateCount();
            }
          }finally{
            window.location.assign(href);
          }
        });
      }

      status.textContent=activities.length
        ?`${activities.length} Community updates.`
        :'No Community updates yet.';
    }catch{
      status.textContent='Community notifications are unavailable.';
      count.hidden=true;
      list.replaceChildren();
    }
  }

  void load();
}



