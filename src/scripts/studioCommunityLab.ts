export {};

type Reply = {
  id: string;
  author: string;
  text: string;
  parent: string | null;
  date: number;
  deleted?: boolean;
  images: string[];
};

type Discussion = {
  id: string;
  audience: string;
  chapter: string;
  topic: string;
  author: string;
  question: string;
  date: number;
  replies: Reply[];
  images: string[];
  unread: boolean;
};

const root = document.querySelector<HTMLElement>('[data-community-lab]');

if (root) {
  const labRoot = root;
  const chapters = [...root.querySelectorAll<HTMLButtonElement>('[data-chapter]')]
    .filter(b => b.dataset.chapter !== 'all')
    .map(b => ({id:b.dataset.chapter!, name:b.querySelector('strong')?.textContent?.trim() ?? b.textContent!.trim()}));

  const topics = [...root.querySelectorAll<HTMLOptionElement>('[data-topic] option')]
    .filter(o => o.value !== 'all')
    .map(o => ({id:o.value,label:o.textContent!.trim()}));

  const list = root.querySelector<HTMLElement>('[data-list]')!;
  const detail = root.querySelector<HTMLElement>('[data-detail]')!;
  const compose = root.querySelector<HTMLElement>('[data-compose]')!;
  const results = root.querySelector<HTMLElement>('[data-results]')!;
  const search = root.querySelector<HTMLInputElement>('[data-search]')!;
  const topicSelect = root.querySelector<HTMLSelectElement>('[data-topic]')!;
  const sortSelect = root.querySelector<HTMLSelectElement>('[data-sort]')!;
  const mineCheck = root.querySelector<HTMLInputElement>('[data-mine]')!;
  const unreadCheck = root.querySelector<HTMLInputElement>('[data-unread]')!;

  const myName = 'You · Preview member';
  const now = Date.now();
  const day = 86400000;

  let audience = 'general_community';
  let chapter = 'all';

  const discussions: Discussion[] = [
    {
      id:crypto.randomUUID(),audience:'general_community',
      chapter:'spark',topic:'originality',author:'Maya R.',
      question:'How do I know whether my deck has a distinctive central idea?',
      date:now-day,replies:[
        {id:crypto.randomUUID(),author:'Leilia',parent:null,
         text:'Begin with what the deck enables someone to recognise, practise or understand.',date:now-5000000,images:[]},
        {id:crypto.randomUUID(),author:'Thomas',parent:null,
         text:'I had been describing my artwork rather than what someone could do with the cards.',date:now-3000000,images:[]}
      ],images:[],unread:true
    },
    {
      id:crypto.randomUUID(),audience:'general_community',
      chapter:'architecture',topic:'structure',author:'Amara',
      question:'Should I decide the number of cards before developing the framework?',
      date:now-2*day,replies:[
        {id:crypto.randomUUID(),author:'Sophie',parent:null,
         text:'I started with twelve themes and discovered several needed more than one card.',date:now-day,images:[]}
      ],images:[],unread:false
    },
    {
      id:crypto.randomUUID(),audience:'general_community',
      chapter:'visual-world',topic:'visual-design',author:'Daniel',
      question:'How do you compare different illustration styles before choosing an artist?',
      date:now-3*day,replies:[],images:[],unread:true
    },
    {
      id:crypto.randomUUID(),audience:'private_community',
      chapter:'expression',topic:'writing',author:'Priya',
      question:'How do I distinguish confidential research from reader-facing guidebook text?',
      date:now-day,replies:[],images:[],unread:false
    },
    {
      id:crypto.randomUUID(),audience:'private_community',
      chapter:'making',topic:'production',author:myName,
      question:'Would a small prototype print run be worthwhile?',
      date:now-2*day,replies:[],images:[],unread:true
    }
  ];

  const elem = (tag:string, text?:string):HTMLElement => {
    const e=document.createElement(tag);
    if(text!==undefined)e.textContent=text;
    return e;
  };

  function button(text:string,action:()=>void):HTMLButtonElement {
    const b=elem('button',text) as HTMLButtonElement;
    b.type='button';
    b.addEventListener('click',action);
    return b;
  }

  function labelFor(items:{id:string;label?:string;name?:string}[],id:string) {
    return items.find(t=>t.id===id)?.label ??
      items.find(t=>t.id===id)?.name ?? id;
  }

  function date(n:number) {
    return new Date(n).toLocaleDateString('en-GB',{
      day:'numeric',month:'short',year:'numeric'
    });
  }

  function activity(d:Discussion) {
    return Math.max(d.date,...d.replies.map(r=>r.date));
  }

  function mine(d:Discussion) {
    return d.author===myName ||
      d.replies.some(r=>r.author===myName);
  }

  function setChoice(attribute:string,value:string) {
    labRoot.querySelectorAll<HTMLButtonElement>(`[${attribute}]`).forEach(b=>{
      b.setAttribute('aria-pressed',String(b.getAttribute(attribute)===value));
    });
  }

  function showImages(parent:HTMLElement,images:string[]) {
    if(!images.length)return;
    const gallery=elem('div');
    gallery.style.cssText='display:flex;gap:.6rem;flex-wrap:wrap;margin:.7rem 0';
    images.forEach(src=>{
      const image=document.createElement('img');
      image.src=src;
      image.alt='Member-supplied visual reference, local preview';
      image.style.cssText='width:120px;max-width:100%;height:120px;object-fit:contain;background:white;border:1px solid #ddd';
      gallery.append(image);
    });
    parent.append(gallery);
  }

  function imageInput(parent:HTMLElement) {
    const holder=elem('div');
    const lab=elem('label','Optional visual references (up to 3 images, 5 MB each)');
    const input=document.createElement('input');
    input.type='file';
    input.accept='image/jpeg,image/png,image/webp';
    input.multiple=true;
    lab.append(input);
    holder.append(lab);
    parent.append(holder);

    return () => {
      const files=Array.from(input.files??[]);
      if(files.length>3||files.some(f=>
        f.size>5*1024*1024 ||
        f.size===0 ||
        !['image/jpeg','image/png','image/webp'].includes(f.type)
      )){
        alert('Choose up to three JPEG, PNG or WebP images, each no larger than 5 MB.');
        return null;
      }
      return files.map(f=>URL.createObjectURL(f));
    };
  }

  function renderIndex() {
    detail.hidden=true;
    compose.hidden=true;
    list.hidden=false;

    const term=search.value.trim().toLowerCase();
    const filtered=discussions.filter(d=>
      d.audience===audience &&
      (chapter==='all'||d.chapter===chapter) &&
      (topicSelect.value==='all'||d.topic===topicSelect.value) &&
      (!mineCheck.checked||mine(d)) &&
      (!unreadCheck.checked||d.unread) &&
      (!term||[
        d.question,d.author,
        labelFor(chapters,d.chapter),
        labelFor(topics,d.topic),
        ...d.replies.filter(r=>!r.deleted).map(r=>r.text)
      ].join(' ').toLowerCase().includes(term))
    );

    filtered.sort((a,b)=>
      sortSelect.value==='newest' ? b.date-a.date :
      sortSelect.value==='discussed' ? b.replies.length-a.replies.length :
      activity(b)-activity(a)
    );

    results.textContent=`${filtered.length} ${filtered.length===1?"conversation":"conversations"}`;
    list.replaceChildren();

    if(!filtered.length){
      list.append(elem('p','No conversations match these filters.'));
    }

    filtered.forEach(d=>{
      const card=elem('article');
      const meta=elem('small',
        `${labelFor(chapters,d.chapter)} · ${labelFor(topics,d.topic)} · ${d.author} · ${date(d.date)}`
      );
      const open=button(d.question,()=>renderDetail(d.id));
      open.style.display='block';
      open.style.margin='.45rem 0';
      const info=elem('small',
        `${d.replies.filter(r=>!r.deleted).length} replies · Last active ${date(activity(d))}${d.unread?' · Unread':''}`
      );
      card.append(meta,open,info);
      list.append(card);
    });
  }

  function renderDetail(id:string) {
    const d=discussions.find(x=>x.id===id);
    if(!d||d.audience!==audience)return;
    const thread: Discussion = d;
    d.unread=false;
    list.hidden=true;
    compose.hidden=true;
    detail.hidden=false;
    detail.replaceChildren();

    detail.append(button('← Back to conversations',renderIndex));
    detail.append(elem('p',
      `${labelFor(chapters,d.chapter)} · ${labelFor(topics,d.topic)} · ${d.author} · ${date(d.date)}`
    ));
    const heading=elem('h2',d.question);
    heading.style.fontSize='1.3rem';
    detail.append(heading);
    showImages(detail,d.images);

    const replies=elem('div');
    detail.append(replies);

    function drawReplies(){
      replies.replaceChildren();
      const parents=thread.replies.filter(r=>!r.parent);
      parents.forEach(r=>{
        const block=elem('div');
        block.className='lab-reply';
        const meta=elem('small',`${r.author} · ${date(r.date)}`);
        block.append(meta,elem('p',r.deleted?'Comment deleted':r.text));
        if(!r.deleted)showImages(block,r.images);

        if(r.author===myName&&!r.deleted){
          block.append(button('Edit',()=>{
            const value=prompt('Edit your comment',r.text);
            if(value?.trim()){
              r.text=value.trim();
              r.date=Date.now();
              drawReplies();
            }
          }));
          block.append(button('Delete',()=>{
            if(confirm('Delete this comment? Existing responses will remain.')){
              r.deleted=true;r.text='';r.images=[];
              drawReplies();
            }
          }));
        }

        if(!r.deleted){
          block.append(button('Reply',()=>replyForm(block,r.id)));
        }

        thread.replies.filter(x=>x.parent===r.id).forEach(child=>{
          const nested=elem('div');
          nested.className='lab-reply lab-child';
          nested.append(elem('small',`${child.author} · ${date(child.date)}`));
          nested.append(elem('p',child.deleted?'Comment deleted':child.text));
          if(!child.deleted)showImages(nested,child.images);
          if(child.author===myName&&!child.deleted){
            nested.append(button('Edit',()=>{
              const value=prompt('Edit your reply',child.text);
              if(value?.trim()){child.text=value.trim();child.date=Date.now();drawReplies();}
            }));
            nested.append(button('Delete',()=>{
              if(confirm('Delete this reply?')){
                child.deleted=true;child.text='';child.images=[];drawReplies();
              }
            }));
          }
          block.append(nested);
        });
        replies.append(block);
      });
    }

    function replyForm(target:HTMLElement,parent:string|null){
      target.querySelector('[data-lab-reply-form]')?.remove();
      const form=elem('form') as HTMLFormElement;
      form.dataset.labReplyForm='true';
      const textarea=document.createElement('textarea');
      textarea.required=true;
      textarea.minLength=2;
      textarea.maxLength=8000;
      textarea.rows=3;
      textarea.placeholder=parent?'Reply to this comment':'Add to the conversation';
      const getImages=imageInput(form);
      const submit=elem('button','Post reply') as HTMLButtonElement;
      submit.type='submit';
      form.append(textarea,submit);
      form.addEventListener('submit',e=>{
        e.preventDefault();
        if(!form.reportValidity())return;
        const images=getImages();
        if(images===null)return;
        thread.replies.push({
          id:crypto.randomUUID(),author:myName,
          parent,text:textarea.value.trim(),
          date:Date.now(),images
        });
        drawReplies();
      });
      target.append(form);
      textarea.focus();
    }

    drawReplies();
    replyForm(detail,null);
  }

  function showComposer(){
    list.hidden=true;
    detail.hidden=true;
    compose.hidden=false;
    compose.replaceChildren();
    compose.append(button('← Back to conversations',renderIndex));
    compose.append(elem('h2','Start a discussion'));

    const form=elem('form') as HTMLFormElement;
    const chapterLabel=elem('label','Creative Chapter (required)');
    const chapterInput=document.createElement('select');
    chapterInput.required=true;
    chapterInput.append(new Option('Choose a chapter',''));
    chapters.forEach(c=>chapterInput.append(new Option(c.name,c.id)));
    chapterInput.value=chapter==='all'?'':chapter;
    chapterLabel.append(chapterInput);

    const topicLabel=elem('label','Primary topic (required)');
    const topicInput=document.createElement('select');
    topicInput.required=true;
    topicInput.append(new Option('Choose a topic',''));
    topics.forEach(t=>topicInput.append(new Option(t.label,t.id)));
    topicLabel.append(topicInput);

    const questionLabel=elem('label','Your question');
    const questionInput=document.createElement('textarea');
    questionInput.required=true;
    questionInput.minLength=20;
    questionInput.maxLength=5900;
    questionInput.rows=5;
    questionLabel.append(questionInput);

    const getImages=imageInput(form);
    const submit=elem('button','Publish to local preview') as HTMLButtonElement;
    submit.type='submit';

    form.append(chapterLabel,topicLabel,questionLabel,submit);
    form.style.cssText='display:grid;gap:1rem;margin-top:1rem';
    compose.append(form);

    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!form.reportValidity())return;
      const images=getImages();
      if(images===null)return;
      const d:Discussion={
        id:crypto.randomUUID(),audience,
        chapter:chapterInput.value,topic:topicInput.value,
        author:myName,question:questionInput.value.trim(),
        date:Date.now(),replies:[],images,unread:false
      };
      discussions.unshift(d);
      renderDetail(d.id);
    });
  }

  root.querySelectorAll<HTMLButtonElement>('[data-audience]').forEach(b=>
    b.addEventListener('click',()=>{
      audience=b.dataset.audience!;
      setChoice('data-audience',audience);
      renderIndex();
    })
  );

  root.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach(b=>
    b.addEventListener('click',()=>{
      const destination=b.dataset.chapter!;

      if(destination==='all'){
        chapter='all';
        setChoice('data-chapter',chapter);
        renderIndex();
        document.getElementById('community-conversations')
          ?.scrollIntoView({behavior:'smooth',block:'start'});
        return;
      }

      if(!chapters.some(c=>c.id===destination))return;

      window.location.assign(
        `/studio/community-lab/${encodeURIComponent(destination)}/`
      );
    })
  );

  [search,topicSelect,sortSelect,mineCheck,unreadCheck].forEach(control=>
    control.addEventListener('input',renderIndex)
  );

  root.querySelector<HTMLButtonElement>('[data-new]')?.addEventListener('click',showComposer);

  window.addEventListener('beforeunload',()=>{
    discussions.forEach(d=>{
      [...d.images,...d.replies.flatMap(r=>r.images)].forEach(
        url=>URL.revokeObjectURL(url)
      );
    });
  });

  renderIndex();
}





