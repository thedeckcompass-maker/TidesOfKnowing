/* Stage 7 Circle Reddit controller */
export {};

type Reply = {
  id:string;
  author:string;
  text:string;
  parent:string|null;
  replyTo:string|null;
  date:number;
  deleted?:boolean;
};

type Discussion = {
  id:string;
  chapter:string;
  topic:string;
  question:string;
  author:string;
  date:number;
  replies:Reply[];
};

const root=document.querySelector<HTMLElement>('[data-forum-discussion-page]');

if(root){
  const chapter=root.dataset.chapter??'';
  const id=root.dataset.discussionId??'';
  const content=root.querySelector<HTMLElement>('[data-discussion-content]')!;
  const responses=root.querySelector<HTMLElement>('[data-discussion-replies]')!;
  const mainForm=root.querySelector<HTMLFormElement>('[data-discussion-reply-form]')!;
  const status=root.querySelector<HTMLElement>('[data-discussion-status]')!;
  const textarea=mainForm.querySelector<HTMLTextAreaElement>('textarea[name="body"]')!;
  const storageKey='studio-community-lab-discussions';
  const replyKey='studio-community-lab-replies';
  const avatarKey='dcs-community-avatar-local-v1';
  const myName='You';

  function readArray(key:string):any[]{
    try{
      const value=JSON.parse(sessionStorage.getItem(key)??'[]');
      return Array.isArray(value)?value:[];
    }catch{return [];}
  }

  function node<K extends keyof HTMLElementTagNameMap>(
    tag:K,text?:string
  ):HTMLElementTagNameMap[K]{
    const result=document.createElement(tag);
    if(text!==undefined)result.textContent=text;
    return result;
  }

  function button(label:string,handler:()=>void,className='forum-action'){
    const result=node('button',label);
    result.type='button';
    result.className=className;
    result.addEventListener('click',handler);
    return result;
  }

  function avatar(name:string,size:'large'|'small'='small'){
    const element=node('span');
    element.className=`forum-avatar forum-avatar--${size}`;
    const initials=name==='You'?'Y':
      name.trim().split(/\s+/).slice(0,2)
        .map(part=>part.charAt(0).toUpperCase()).join('');
    element.textContent=initials;
    element.setAttribute('aria-label',name);

    if(name==='You'){
      try{
        const saved=localStorage.getItem(avatarKey);
        if(saved?.startsWith('data:image/jpeg;base64,')){
          const image=node('img');
          image.src=saved;
          image.alt='';
          element.replaceChildren(image);
        }
      }catch{}
    }
    return element;
  }

  function relativeTime(value:number){
    if(!Number.isFinite(value))return '';
    const minutes=Math.max(0,Math.floor((Date.now()-value)/60000));
    if(minutes<1)return 'Just now';
    if(minutes<60)return `${minutes}m ago`;
    const hours=Math.floor(minutes/60);
    if(hours<24)return `${hours}h ago`;
    const days=Math.floor(hours/24);
    return `${days}d ago`;
  }

  const existing=readArray(storageKey);
  const stored=existing.find(d=>d?.id===id&&d?.chapter===chapter);

  let discussion:Discussion|null=null;
  if(stored){
    discussion={
      ...stored,
      replies:Array.isArray(stored.replies)?stored.replies:[]
    };
  }else{
    try{
      const fixture=JSON.parse(root.dataset.example??'null');
      if(fixture?.id===id&&fixture?.chapter===chapter){
        discussion={...fixture,date:Date.now()-86400000,replies:[]};
      }
    }catch{}
  }

  function persist(value:Discussion):boolean{
    try{
      if(stored){
        const all=readArray(storageKey);
        const index=all.findIndex(d=>d?.id===id);
        if(index<0)return false;
        all[index]=value;
        sessionStorage.setItem(storageKey,JSON.stringify(all));
      }else{
        const all=readArray(replyKey).filter(d=>d?.id!==id);
        all.push({id,replies:value.replies});
        sessionStorage.setItem(replyKey,JSON.stringify(all));
      }
      return true;
    }catch{return false;}
  }

  function showError(message:string){
    status.textContent=message;
    status.hidden=false;
  }

  if(!discussion){
    content.replaceChildren(node('p','This discussion is unavailable.'));
    mainForm.hidden=true;
  }else{
    const active=discussion;

    if(!stored){
      const saved=readArray(replyKey).find(d=>d?.id===id);
      if(saved&&Array.isArray(saved.replies)){
        active.replies=saved.replies;
      }else if(id==='11111111-1111-4111-8111-111111111111'){
        const now=Date.now(),hour=3600000;
        active.replies=[
          {id:'demo-reply-1',author:'Maya',text:'I usually begin by looking at how each artist handles atmosphere. A beautiful portfolio is not necessarily the right visual language for a particular deck.',parent:null,replyTo:null,date:now-26*hour},
          {id:'demo-reply-2',author:'Daniel',text:'That distinction between a beautiful image and the right visual language is exactly what I have been struggling with.',parent:'demo-reply-1',replyTo:'demo-reply-1',date:now-24*hour},
          {id:'demo-reply-3',author:'Sofia',text:'Have you considered asking artists to interpret the same card? It might reveal differences that are difficult to see across unrelated portfolio pieces.',parent:null,replyTo:null,date:now-20*hour},
          {id:'demo-reply-4',author:'Amara',text:'I would also give them a short description of the emotional effect you want, rather than prescribing every visual element.',parent:'demo-reply-3',replyTo:'demo-reply-3',date:now-17*hour},
          {id:'demo-reply-5',author:'Maya',text:'Yes. That leaves room for the artist to bring something original to the interpretation.',parent:'demo-reply-3',replyTo:'demo-reply-4',date:now-14*hour},
          {id:'demo-reply-6',author:'Daniel',text:'I am realising that consistency matters more to me than whether every individual illustration is impressive.',parent:null,replyTo:null,date:now-9*hour},
          {id:'demo-reply-7',author:'Sofia',text:'A small group of test cards could help you assess that consistency before committing to the full deck.',parent:'demo-reply-6',replyTo:'demo-reply-6',date:now-5*hour},
          {id:'demo-reply-8',author:'Amara',text:'I found it useful to give two artists the same short creative brief and compare their interpretations.',parent:null,replyTo:null,date:now-18*60000}
        ];
      }
    }

    const openGroups=new Set<string>();
    let editing:string|null=null;
    let responding:string|null=null;
    let mainExpanded=false;

    content.replaceChildren();
    const origin=node('article');
    origin.className='forum-origin';
    const originMeta=node('div');
    originMeta.className='forum-author-row';
    const originIdentity=node('div');
    originIdentity.className='forum-author-details';
    originIdentity.append(
      node('strong',String(active.author)),
      node('time',relativeTime(active.date))
    );
    originMeta.append(avatar(String(active.author),'large'),originIdentity);
    const topic=node('span',active.topic.replaceAll('-',' '));
    topic.className='forum-topic-pill';
    const title=node('h1',active.question);
    title.className='forum-question';
    const questionColumn=node('div');
    questionColumn.className='forum-origin-question';
    questionColumn.append(topic,title);
    origin.append(originMeta,questionColumn);
    content.append(origin);

    function updateMainComposer(){
      mainForm.classList.toggle('is-expanded',mainExpanded);
      textarea.rows=mainExpanded?4:1;
      const submit=mainForm.querySelector<HTMLButtonElement>('[type="submit"]');
      if(submit)submit.hidden=!mainExpanded;
    }

    textarea.addEventListener('focus',()=>{
      mainExpanded=true;
      updateMainComposer();
    });

    function commit(reply:Reply){
      active.replies.push(reply);
      if(!persist(active)){
        active.replies.pop();
        return false;
      }
      return true;
    }

    function inlineComposer(target:HTMLElement,reply:Reply){
      if(responding===reply.id){
        responding=null;
        render();
        return;
      }

      responding=reply.id;
      editing=null;
      render();

      const holder=responses.querySelector<HTMLElement>(
        `[data-reply-id="${reply.id}"]`
      );
      if(!holder)return;

      const form=node('form');
      form.className='forum-inline-composer';
      const field=node('textarea');
      field.rows=2;
      field.required=true;
      field.minLength=2;
      field.maxLength=8000;
      field.placeholder=`Reply to ${reply.author}…`;
      field.setAttribute('aria-label',`Reply to ${reply.author}`);

      const actions=node('div');
      actions.className='forum-inline-actions';
      const submit=node('button','Reply');
      submit.type='submit';
      submit.className='forum-primary-action';
      actions.append(
        submit,
        button('Cancel',()=>{
          responding=null;
          render();
        })
      );
      form.append(field,actions);

      form.addEventListener('submit',event=>{
        event.preventDefault();
        if(!form.reportValidity())return;
        const text=field.value.trim();
        if(text.length<2)return;

        const top=reply.parent
          ?active.replies.find(r=>r.id===reply.parent)
          :reply;
        if(!top)return;

        const next:Reply={
          id:crypto.randomUUID(),
          author:myName,
          text,
          parent:top.id,
          replyTo:reply.id,
          date:Date.now()
        };

        if(!commit(next)){
          showError('Could not save your reply. Your writing is preserved.');
          return;
        }

        openGroups.add(top.id);
        responding=null;
        render();
      });

      holder.append(form);
      field.focus();
    }

    function editInline(reply:Reply){
      editing=reply.id;
      responding=null;
      render();
      const holder=responses.querySelector<HTMLElement>(
        `[data-reply-id="${reply.id}"]`
      );
      if(!holder)return;

      const oldText=holder.querySelector('.forum-comment-text');
      if(oldText)oldText.remove();

      const form=node('form');
      form.className='forum-inline-composer';
      const field=node('textarea');
      field.value=reply.text;
      field.rows=3;
      field.required=true;
      field.minLength=2;
      field.maxLength=8000;
      field.setAttribute('aria-label','Edit your comment');

      const actions=node('div');
      actions.className='forum-inline-actions';
      const submit=node('button','Save');
      submit.type='submit';
      submit.className='forum-primary-action';
      actions.append(
        submit,
        button('Cancel',()=>{
          editing=null;
          render();
        })
      );
      form.append(field,actions);

      form.addEventListener('submit',event=>{
        event.preventDefault();
        if(!form.reportValidity())return;
        const next=field.value.trim();
        if(!next)return;
        const previous=reply.text;
        reply.text=next;
        if(!persist(active)){
          reply.text=previous;
          showError('Could not save your change.');
          return;
        }
        editing=null;
        render();
      });
      holder.append(form);
      field.focus();
    }

    function removeReply(reply:Reply){
      const hasChildren=active.replies.some(
        child=>child.parent===reply.id
      );
      if(hasChildren&&!confirm(
        'Remove your comment? Its responses will remain visible.'
      ))return;

      const previous=active.replies.map(item=>({...item}));

      if(hasChildren){
        reply.deleted=true;
        reply.text='';
      }else{
        active.replies=active.replies.filter(item=>item.id!==reply.id);
      }

      if(!persist(active)){
        active.replies=previous;
        showError('Could not remove your comment.');
        return;
      }
      render();
    }

    function comment(reply:Reply,child=false):HTMLElement{
      const article=node('article');
      article.className=child
        ?'forum-comment forum-comment--child'
        :'forum-comment';
      article.dataset.replyId=reply.id;

      const hasChildren=active.replies.some(r=>r.parent===reply.id);
      if(reply.deleted&&!hasChildren)return article;

      const header=node('div');
      header.className='forum-comment-header';

      if(!reply.deleted){
        header.append(avatar(reply.author));
      }else{
        const placeholder=node('span','');
        placeholder.className='forum-avatar forum-avatar--small forum-avatar--empty';
        header.append(placeholder);
      }

      const identity=node('div');
      identity.className='forum-comment-identity';
      const byline=node('div');
      byline.className='forum-comment-byline';
      byline.append(
        node('strong',reply.deleted?'Deleted comment':reply.author),
        node('time',relativeTime(reply.date))
      );
      identity.append(byline);

      const referenced=reply.replyTo
        ?active.replies.find(r=>r.id===reply.replyTo)
        :null;
      if(referenced&&!referenced.deleted&&referenced.id!==reply.parent){
        const context=node('span',`Replying to ${referenced.author}`);
        context.className='forum-reply-context';
        identity.append(context);
      }

      header.append(identity);
      article.append(header);

      if(!reply.deleted){
        const body=node('p',reply.text);
        body.className='forum-comment-text';
        article.append(body);

        const actions=node('div');
        actions.className='forum-comment-actions';
        actions.append(
          button('Reply',()=>inlineComposer(article,reply))
        );

        if(reply.author===myName){
          const menu=node('details');
          menu.className='forum-comment-menu';
          const summary=node('summary','•••');
          summary.setAttribute('aria-label','Comment options');
          menu.append(summary);
          const options=node('div');
          options.className='forum-comment-menu-options';
          options.append(
            button('Edit',()=>editInline(reply)),
            button('Delete',()=>removeReply(reply))
          );
          menu.append(options);
          actions.append(menu);
        }
        article.append(actions);
      }
      return article;
    }

    function render(){
      responses.replaceChildren();

      const parents=active.replies
        .filter(r=>!r.parent)
        .sort((a,b)=>a.date-b.date);

      if(!parents.length){
        const empty=node('p','Be the first to reply.');
        empty.className='forum-empty';
        responses.append(empty);
      }

      for(const parent of parents){
        const children=active.replies
          .filter(r=>r.parent===parent.id)
          .sort((a,b)=>a.date-b.date);

        if(parent.deleted&&!children.length)continue;

        const group=node('div');
        group.className='forum-comment-group';
        group.append(comment(parent));

        if(children.length){
          const expanded=openGroups.has(parent.id);

          const toggle=button(
            expanded?'Hide replies':`View ${children.length} replies`,
            ()=>{
              if(openGroups.has(parent.id))openGroups.delete(parent.id);
              else openGroups.add(parent.id);
              render();
            },
            'forum-thread-toggle'
          );
          group.append(toggle);

          if(openGroups.has(parent.id)){
            const branch=node('div');
            branch.className='forum-comment-branch';
            for(const child of children){
              if(!child.deleted)branch.append(comment(child,true));
            }
            group.append(branch);
          }
        }
        responses.append(group);
      }
    }

    mainForm.addEventListener('submit',event=>{
      event.preventDefault();
      if(!mainForm.reportValidity())return;
      const text=textarea.value.trim();
      if(text.length<2)return;

      const reply:Reply={
        id:crypto.randomUUID(),
        author:myName,
        text,
        parent:null,
        replyTo:null,
        date:Date.now()
      };

      if(!commit(reply)){
        showError('Could not save your reply. Your writing is preserved.');
        return;
      }

      textarea.value='';
      status.textContent='';
      status.hidden=true;
      mainExpanded=false;
      updateMainComposer();
      render();
    });

    status.textContent='';
    status.hidden=true;
    updateMainComposer();
    render();
  }
}



